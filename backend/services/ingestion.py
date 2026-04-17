from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from models.schemas import Chunk, ChunkingConfig
from services import chunking, embedding, qdrant as qdrant_svc


async def ingest(
    collection_name: str,
    text: str,
    filename: str,
    config: ChunkingConfig,
    metadata: dict[str, Any],
) -> tuple[str, list[Chunk]]:
    document_id = str(uuid4())
    chunks = chunking.chunk(text, config)

    if not chunks:
        return document_id, []

    #chunk 객체에서 text만 추출해서 list에 담기
    texts = [c.text for c in chunks]
    dense_vectors = embedding.encode(texts)

    #전체 chunk의 기본 메타데이터 한번 만들기
    base_payload = {
        "document_id": document_id,
        "filename": filename,
        "total_chunks": len(chunks),
        "strategy": config.strategy,
        "chunk_size": config.chunk_size,
        "ingested_at": datetime.now(timezone.utc).isoformat(),
        "extra": metadata,
    }

    #각 chunk마다 고유 정보 만들기. base_payload + chunk index
    payloads = [
        {**base_payload, "chunk_index": c.index}
        for c in chunks
    ]

    await qdrant_svc.upsert_chunks(
        collection_name=collection_name,
        texts=texts,
        dense_vectors=dense_vectors,
        payloads=payloads,
    )

    return document_id, chunks
