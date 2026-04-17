// ── Collections ───────────────────────────────────────────────────────────────

export interface CollectionInfo {
  name: string;
  vectors_count: number;
  points_count: number;
  system_prompt: string;
}

export interface CollectionStats {
  name: string;
  vectors_count: number;
  points_count: number;
  segments_count: number;
  disk_data_size: number;
  ram_data_size: number;
}

export interface CollectionCreate {
  name: string;
  system_prompt?: string;
}

export interface CollectionMetaUpdate {
  system_prompt: string;
}

// ── Documents ────────────────────────────────────────────────────────────────

export type ChunkStrategy = "fixed" | "sentence" | "recursive";

export interface ChunkingConfig {
  strategy: ChunkStrategy;
  chunk_size: number;
  overlap: number;
}

export interface Chunk {
  index: number;
  text: string;
  char_count: number;
}

export interface ChunkPreviewRequest {
  text: string;
  config: ChunkingConfig;
}

export interface ChunkPreviewResponse {
  chunks: Chunk[];
  total_chunks: number;
  strategy: string;
  chunk_size: number;
}

export interface DocumentInfo {
  document_id: string;
  filename: string;
  chunk_count: number;
  strategy: string;
  chunk_size: number;
  ingested_at: string;
  extra: Record<string, unknown>;
}

export interface DeleteResponse {
  deleted: number;
}

// ── Search ───────────────────────────────────────────────────────────────────

export type SearchMode = "vector" | "hybrid";

export interface SearchRequest {
  query: string;
  top_k: number;
  mode: SearchMode;
  filters?: Record<string, unknown> | null;
}

export interface SearchResult {
  id: string;
  score: number;
  text: string;
  document_id: string;
  filename: string;
  chunk_index: number;
  total_chunks: number;
  strategy: string;
  chunk_size: number;
  ingested_at: string;
  extra: Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  mode: string;
  latency_ms: number;
}

// ── RAG ──────────────────────────────────────────────────────────────────────

export interface RAGRequest {
  query: string;
  top_k: number;
  mode: SearchMode;
  include_no_rag?: boolean;
}

export interface RAGResponse {
  answer: string;
  chunks: SearchResult[];
  prompt: string;
  input_tokens: number;
  output_tokens: number;
  total_latency_ms: number;
}

// ── SSE Events ────────────────────────────────────────────────────────────────

export interface TraceRetrievalEvent {
  stage: "retrieval";
  chunks: SearchResult[];
  latency_ms: number;
}

export interface TracePromptEvent {
  stage: "prompt_built";
  prompt: string;
  token_count: number;
}

export interface TokenEvent {
  text: string;
}

export interface DoneEvent {
  total_latency_ms: number;
  input_tokens: number;
  output_tokens: number;
}

export type SSETraceEvent = TraceRetrievalEvent | TracePromptEvent;

// ── Experiments ──────────────────────────────────────────────────────────────

export interface ChunkSizeResult {
  chunk_size: number;
  chunks_created: number;
  results: SearchResult[];
  answer: string;
  latency_ms: number;
}

export interface ChunkSizeExperimentResponse {
  query: string;
  results: ChunkSizeResult[];
}

export interface TopKResult {
  k: number;
  results: SearchResult[];
  answer: string;
  latency_ms: number;
}

export interface TopKExperimentResponse {
  query: string;
  results: TopKResult[];
}
