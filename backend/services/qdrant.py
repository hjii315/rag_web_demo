from __future__ import annotations

import time
from functools import lru_cache
from typing import Any
from uuid import uuid4

from fastembed import SparseTextEmbedding
from qdrant_client import AsyncQdrantClient, models
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    SparseVector,
    SparseVectorParams,
    VectorParams,
)

from config import settings
from models.schemas import CollectionInfo, CollectionStats, SearchResult

DENSE_DIM = 768 #벡터 차원 수. 임베딩 모델에 따라서 고정. 원래는 384..
DENSE_NAME = "dense"
SPARSE_NAME = "sparse"


@lru_cache(maxsize=1)
def _client() -> AsyncQdrantClient:
    return AsyncQdrantClient(url=settings.qdrant_url)


#텍스트를 벡터로 변환하는 모델
#키워드기반
@lru_cache(maxsize=1)
def _sparse_encoder() -> SparseTextEmbedding:
    return SparseTextEmbedding(model_name="Qdrant/bm25")


def _make_sparse(texts: list[str]) -> list[SparseVector]:
    encoder = _sparse_encoder() #SparseTextEmbedding 모델 가져오기
    results = list(encoder.embed(texts)) #벡터로 변환해서 리스트에 담기
    sparse_vecs: list[SparseVector] = [] #SparseVector 객체 리스트
    for r in results:
        indices = r.indices.tolist()
        values = r.values.tolist()
        sparse_vecs.append(SparseVector(indices=indices, values=values))
    return sparse_vecs


# ── Collection CRUD ───────────────────────────────────────────────────────────

async def list_collections() -> list[CollectionInfo]:
    client = _client()
    response = await client.get_collections()
    infos: list[CollectionInfo] = []
    for col in response.collections:
        info = await client.get_collection(col.name)
        points_count = info.points_count or 0
        vectors_count = getattr(info, "vectors_count", None) or points_count
        infos.append(
            CollectionInfo(
                name=col.name,
                vectors_count=vectors_count,
                points_count=points_count,
            )
        )
    return infos


async def create_collection(name: str) -> None:
    client = _client()
    await client.create_collection(
        collection_name=name,
        vectors_config={DENSE_NAME: VectorParams(size=DENSE_DIM, distance=Distance.COSINE)},
        sparse_vectors_config={SPARSE_NAME: SparseVectorParams()},
    )


async def delete_collection(name: str) -> None:
    client = _client()
    await client.delete_collection(collection_name=name)


async def get_collection_stats(name: str) -> CollectionStats:
    client = _client()
    info = await client.get_collection(name)
    return CollectionStats(
        name=name,
        vectors_count=info.vectors_count or 0,
        points_count=info.points_count or 0,
        segments_count=info.segments_count or 0,
        disk_data_size=info.disk_data_size or 0,
        ram_data_size=info.ram_data_size or 0,
    )


# ── Upsert ────────────────────────────────────────────────────────────────────

async def upsert_chunks(
    collection_name: str, #컬렉션 이름
    texts: list[str], #원본 (문서 청킹한) 텍스트 ->키워드기반 검색에 사용될거임
    dense_vectors: list[list[float]], #의미 기반으로 벡터화한 결과 ->의미 기반 검색에 사용될거임
    payloads: list[dict[str, Any]], #메타데이터
) -> list[str]:
    sparse_vecs = _make_sparse(texts)

    points: list[PointStruct] = []
    ids: list[str] = []
    for text, dense, sparse, payload in zip(texts, dense_vectors, sparse_vecs, payloads): #4개 리스트 for문으로 동시에 돌기
        point_id = str(uuid4()) #고유id만들기
        ids.append(point_id)
        points.append(
            PointStruct(
                id=point_id,
                vector={
                    DENSE_NAME: dense,
                    SPARSE_NAME: sparse,
                },
                payload={"text": text, **payload}, #원본텍스트+payload(메타데이터)
            )
        )

    client = _client()
    await client.upsert(collection_name=collection_name, points=points) #upsert 해주기
    return ids


# ── Search ────────────────────────────────────────────────────────────────────

#특정 조건(필터건것)만 만족하는 벡터 검색하기위해서
def _build_filter(filters: dict[str, Any] | None) -> Filter | None:
    if not filters:
        return None
    conditions = [
        FieldCondition(key=k, match=MatchValue(value=v))
        for k, v in filters.items()
    ]
    return Filter(must=conditions)

#검색 결과
def _to_search_result(hit: Any) -> SearchResult:
    p = hit.payload or {}
    return SearchResult(
        id=str(hit.id),
        score=hit.score, #유사도 점수
        text=p.get("text", ""), #원본
        document_id=p.get("document_id", ""), #문서id
        filename=p.get("filename", ""), #파일이름
        chunk_index=p.get("chunk_index", 0), #chunk index
        total_chunks=p.get("total_chunks", 0), #문서당 총chunk 수
        strategy=p.get("strategy", ""), #청킹 전략.. fixed, sentence, recursive 중에 뭔지
        chunk_size=p.get("chunk_size", 0), #청킹 사이즈.. 고정이면 청크당 글자 수, 문장기반이면 최대 글자 수, 재귀- 최대 글자 수
        ingested_at=p.get("ingested_at", ""),
        extra=p.get("extra", {}),
    )


async def search(
    collection_name: str,
    query_dense: list[float], #query를 벡터로 변환한 list
    query_text: str, #query 원본
    top_k: int, #top_k (몇개반환할지)
    mode: str, #검색모드.. dense, hybrid 중에 뭔지
    filters: dict[str, Any] | None = None,
) -> tuple[list[SearchResult], float]:
    q_filter = _build_filter(filters)
    t0 = time.perf_counter()
    client = _client()

    if mode == "hybrid": #의미+키워드
        sparse_vecs = _make_sparse([query_text])
        query_sparse = sparse_vecs[0]

        results = await client.query_points(
            collection_name=collection_name,
            prefetch=[
                #의미기반 벡터로 검색한거 topk * 2개
                models.Prefetch(
                    query=query_dense,
                    using=DENSE_NAME,
                    limit=top_k * 2,
                    filter=q_filter,
                ),
                #키워드기반 벡터로 검색한거 topk * 2개
                models.Prefetch(
                    query=models.SparseVector(
                        indices=query_sparse.indices,
                        values=query_sparse.values,
                    ),
                    using=SPARSE_NAME,
                    limit=top_k * 2,
                    filter=q_filter,
                ),
            ],
            # RRF알고리즘으로 두 검색 결과 섞어서 상위 top_k개 반환
            # 1단계: Dense 검색으로 상위 10개 추출
            # 2단계: Sparse 검색으로 상위 10개 추출
            # 3단계: RRF 알고리즘으로 점수 계산 rrf점수= 1/(상수k+rank)
            # 4단계: 상위 top_k개만 반환 - dense와 sparse 검색 결과 둘 다 있으면 점수를 더하고 그렇지 않으면 각자 점수를 씀. 그 중 상위 n개를 반환
            query=models.FusionQuery(fusion=models.Fusion.RRF),
            limit=top_k,
            with_payload=True,
        )
        hits = results.points
    else:
        results = await client.query_points(
            collection_name=collection_name,
            query=query_dense,
            using=DENSE_NAME,
            limit=top_k,
            query_filter=q_filter,
            with_payload=True,
        )
        hits = results.points

    latency_ms = (time.perf_counter() - t0) * 1000
    return [_to_search_result(h) for h in hits], latency_ms


# ── Delete by document_id ─────────────────────────────────────────────────────

async def delete_by_document_id(collection_name: str, document_id: str) -> int:
    q_filter = Filter(
        must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
    )
    client = _client()
    result = await client.delete(
        collection_name=collection_name,
        points_selector=models.FilterSelector(filter=q_filter),
    )
    return result.operation_id or 0


# ── List documents ────────────────────────────────────────────────────────────

async def list_documents(collection_name: str) -> list[dict[str, Any]]:
    """컬렉션의 첫 번째 청크만 스크롤해 문서 목록을 구성."""
    client = _client()
    docs: dict[str, dict[str, Any]] = {}
    offset = None
    while True:
        records, next_offset = await client.scroll(
            collection_name=collection_name,
            limit=100,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )
        for r in records:
            p = r.payload or {}
            doc_id = p.get("document_id", "")
            if doc_id and doc_id not in docs:
                docs[doc_id] = p
            elif doc_id in docs:
                docs[doc_id]["_chunk_count"] = docs[doc_id].get("_chunk_count", 1) + 1

        if next_offset is None:
            break
        offset = next_offset

    return list(docs.values())
