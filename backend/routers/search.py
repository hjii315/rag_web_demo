from fastapi import APIRouter

from models.schemas import SearchRequest, SearchResponse
from services import embedding
from services import qdrant as qdrant_svc

router = APIRouter()


@router.post("/collections/{name}/search", response_model=SearchResponse)
async def search(name: str, body: SearchRequest):
    query_dense = embedding.encode([body.query])[0]
    results, latency_ms = await qdrant_svc.search(
        collection_name=name,
        query_dense=query_dense,
        query_text=body.query,
        top_k=body.top_k,
        mode=body.mode,
        filters=body.filters,
    )
    return SearchResponse(
        results=results,
        query=body.query,
        mode=body.mode,
        latency_ms=latency_ms,
    )
