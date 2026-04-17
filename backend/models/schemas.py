from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


# ── Collections ──────────────────────────────────────────────────────────────

class CollectionCreate(BaseModel):
    name: str
    system_prompt: str = ""


class CollectionInfo(BaseModel):
    name: str
    vectors_count: int
    points_count: int
    system_prompt: str = ""


class CollectionMetaUpdate(BaseModel):
    system_prompt: str


class CollectionStats(BaseModel):
    name: str
    vectors_count: int
    points_count: int
    segments_count: int
    disk_data_size: int
    ram_data_size: int


# ── Documents / Chunks ───────────────────────────────────────────────────────

class ChunkingConfig(BaseModel):
    strategy: Literal["fixed", "sentence", "recursive"] = "recursive"
    chunk_size: int = Field(500, ge=50, le=4000)
    overlap: int = Field(50, ge=0, le=500)


class Chunk(BaseModel):
    index: int
    text: str
    char_count: int


class ChunkPreviewRequest(BaseModel):
    text: str
    config: ChunkingConfig = ChunkingConfig()


class ChunkPreviewResponse(BaseModel):
    chunks: list[Chunk]
    total_chunks: int
    strategy: str
    chunk_size: int


class IngestRequest(BaseModel):
    config: ChunkingConfig = ChunkingConfig()
    metadata: dict[str, Any] = {}


class DocumentInfo(BaseModel):
    document_id: str
    filename: str
    chunk_count: int
    strategy: str
    chunk_size: int
    ingested_at: datetime
    extra: dict[str, Any] = {}


class DeleteResponse(BaseModel):
    deleted: int


# ── Search ───────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str
    top_k: int = Field(5, ge=1, le=20)
    mode: Literal["vector", "hybrid"] = "vector"
    filters: dict[str, Any] | None = None


class SearchResult(BaseModel):
    id: str
    score: float
    text: str
    document_id: str
    filename: str
    chunk_index: int
    total_chunks: int
    strategy: str
    chunk_size: int
    ingested_at: str
    extra: dict[str, Any] = {}


class SearchResponse(BaseModel):
    results: list[SearchResult]
    query: str
    mode: str
    latency_ms: float


# ── RAG ──────────────────────────────────────────────────────────────────────

class RAGRequest(BaseModel):
    query: str
    top_k: int = Field(5, ge=1, le=20)
    mode: Literal["vector", "hybrid"] = "vector"
    include_no_rag: bool = False


class RAGResponse(BaseModel):
    answer: str
    chunks: list[SearchResult]
    prompt: str
    input_tokens: int
    output_tokens: int
    total_latency_ms: float


# ── SSE Events ───────────────────────────────────────────────────────────────

class TraceRetrievalEvent(BaseModel):
    stage: Literal["retrieval"] = "retrieval"
    chunks: list[SearchResult]
    latency_ms: float


class TracePromptEvent(BaseModel):
    stage: Literal["prompt_built"] = "prompt_built"
    prompt: str
    token_count: int


class TokenEvent(BaseModel):
    text: str


class DoneEvent(BaseModel):
    total_latency_ms: float
    input_tokens: int
    output_tokens: int


# ── Experiments ──────────────────────────────────────────────────────────────

class ChunkSizeExperimentRequest(BaseModel):
    collection_name: str
    query: str
    text: str
    chunk_sizes: list[int] = [100, 500, 1000]
    top_k: int = 3


class ChunkSizeResult(BaseModel):
    chunk_size: int
    chunks_created: int
    results: list[SearchResult]
    answer: str
    latency_ms: float


class ChunkSizeExperimentResponse(BaseModel):
    query: str
    results: list[ChunkSizeResult]


class TopKExperimentRequest(BaseModel):
    collection_name: str
    query: str
    k_values: list[int] = [1, 5]


class TopKResult(BaseModel):
    k: int
    results: list[SearchResult]
    answer: str
    latency_ms: float


class TopKExperimentResponse(BaseModel):
    query: str
    results: list[TopKResult]
