import aiosqlite
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from models.schemas import RAGRequest, RAGResponse
from services import rag_pipeline
from services.database import get_db

router = APIRouter()


@router.post("/collections/{name}/rag")
async def rag_stream(
    name: str,
    body: RAGRequest,
    db: aiosqlite.Connection = Depends(get_db),
):
    return StreamingResponse(
        rag_pipeline.run_stream(name, body, db),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/collections/{name}/rag/sync", response_model=RAGResponse)
async def rag_sync(
    name: str,
    body: RAGRequest,
    db: aiosqlite.Connection = Depends(get_db),
):
    return await rag_pipeline.run_sync(name, body, db)
