from __future__ import annotations

import time

from fastapi import APIRouter

from models.schemas import (
    ChunkSizeExperimentRequest,
    ChunkSizeExperimentResponse,
    ChunkSizeResult,
    RAGRequest,
    TopKExperimentRequest,
    TopKExperimentResponse,
    TopKResult,
)
from services import chunking, embedding, ingestion, rag_pipeline
from services import qdrant as qdrant_svc

router = APIRouter()


@router.post("/experiments/chunk-size", response_model=ChunkSizeExperimentResponse)
async def experiment_chunk_size(body: ChunkSizeExperimentRequest):
    from models.schemas import ChunkingConfig

    results: list[ChunkSizeResult] = []
    query_dense = embedding.encode([body.query])[0]

    for size in body.chunk_sizes:
        tmp_collection = f"_exp_{body.collection_name}_{size}"
        try:
            await qdrant_svc.create_collection(tmp_collection)
            config = ChunkingConfig(strategy="fixed", chunk_size=size, overlap=0)
            doc_id, chunks = await ingestion.ingest(
                collection_name=tmp_collection,
                text=body.text,
                filename="experiment",
                config=config,
                metadata={},
            )
            search_results, latency = await qdrant_svc.search(
                collection_name=tmp_collection,
                query_dense=query_dense,
                query_text=body.query,
                top_k=body.top_k,
                mode="vector",
            )

            rag_req = RAGRequest(query=body.query, top_k=body.top_k)
            rag_resp = await rag_pipeline.run_sync(tmp_collection, rag_req)

            results.append(
                ChunkSizeResult(
                    chunk_size=size,
                    chunks_created=len(chunks),
                    results=search_results,
                    answer=rag_resp.answer,
                    latency_ms=latency,
                )
            )
        finally:
            try:
                await qdrant_svc.delete_collection(tmp_collection)
            except Exception:
                pass

    return ChunkSizeExperimentResponse(query=body.query, results=results)


@router.post("/experiments/top-k", response_model=TopKExperimentResponse)
async def experiment_top_k(body: TopKExperimentRequest):
    results: list[TopKResult] = []
    query_dense = embedding.encode([body.query])[0]

    for k in body.k_values:
        t0 = time.perf_counter()
        search_results, _ = await qdrant_svc.search(
            collection_name=body.collection_name,
            query_dense=query_dense,
            query_text=body.query,
            top_k=k,
            mode="vector",
        )
        rag_req = RAGRequest(query=body.query, top_k=k)
        rag_resp = await rag_pipeline.run_sync(body.collection_name, rag_req)
        latency_ms = (time.perf_counter() - t0) * 1000

        results.append(
            TopKResult(
                k=k,
                results=search_results,
                answer=rag_resp.answer,
                latency_ms=latency_ms,
            )
        )

    return TopKExperimentResponse(query=body.query, results=results)
