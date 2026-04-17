from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from models.schemas import (
    ChunkingConfig,
    ChunkPreviewRequest,
    ChunkPreviewResponse,
    DeleteResponse,
    DocumentInfo,
    IngestRequest,
)
from services import chunking, ingestion, pdf_parser
from services import qdrant as qdrant_svc

router = APIRouter()


@router.post(
    "/collections/{name}/documents/preview",
    response_model=ChunkPreviewResponse,
)
async def preview_chunks(
    name: str,
    file: UploadFile = File(...),
    strategy: str = Form("recursive"),
    chunk_size: int = Form(500),
    overlap: int = Form(50),
):
    import json

    file_bytes = await file.read()

    if file.filename and file.filename.lower().endswith(".pdf"):
        text = pdf_parser.extract_text(file_bytes)
    else:
        text = file_bytes.decode("utf-8", errors="replace")

    config = ChunkingConfig(strategy=strategy, chunk_size=chunk_size, overlap=overlap)  # type: ignore[arg-type]
    chunks = chunking.chunk(text, config)
    return ChunkPreviewResponse(
        chunks=chunks,
        total_chunks=len(chunks),
        strategy=config.strategy,
        chunk_size=config.chunk_size,
    )


@router.post("/collections/{name}/documents", status_code=201)
async def ingest_document(
    name: str,
    file: UploadFile = File(...),
    strategy: str = Form("recursive"),
    chunk_size: int = Form(500),
    overlap: int = Form(50),
    metadata: str = Form("{}"),
):
    import json

    file_bytes = await file.read()

    if file.filename and file.filename.lower().endswith(".pdf"):
        text = pdf_parser.extract_text(file_bytes)
    else:
        text = file_bytes.decode("utf-8", errors="replace")

    config = ChunkingConfig(strategy=strategy, chunk_size=chunk_size, overlap=overlap)  # type: ignore[arg-type]
    meta = json.loads(metadata)

    doc_id, chunks = await ingestion.ingest(
        collection_name=name,
        text=text,
        filename=file.filename or "unknown",
        config=config,
        metadata=meta,
    )
    return {"document_id": doc_id, "chunk_count": len(chunks)}


@router.get("/collections/{name}/documents", response_model=list[DocumentInfo])
async def list_documents(name: str):
    raw = await qdrant_svc.list_documents(name)
    docs: list[DocumentInfo] = []
    for p in raw:
        docs.append(
            DocumentInfo(
                document_id=p.get("document_id", ""),
                filename=p.get("filename", ""),
                chunk_count=p.get("_chunk_count", p.get("total_chunks", 0)),
                strategy=p.get("strategy", ""),
                chunk_size=p.get("chunk_size", 0),
                ingested_at=datetime.fromisoformat(p.get("ingested_at", "2000-01-01T00:00:00+00:00")),
                extra=p.get("extra", {}),
            )
        )
    return docs


@router.delete(
    "/collections/{name}/documents/{doc_id}",
    response_model=DeleteResponse,
)
async def delete_document(name: str, doc_id: str):
    op_id = await qdrant_svc.delete_by_document_id(name, doc_id)
    return DeleteResponse(deleted=1)
