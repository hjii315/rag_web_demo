from __future__ import annotations

import json
import time
from pathlib import Path
from typing import AsyncIterator

import anthropic

from config import settings
from models.schemas import (
    DoneEvent,
    RAGRequest,
    RAGResponse,
    SearchResult,
    TokenEvent,
    TracePromptEvent,
    TraceRetrievalEvent,
)
from services import embedding, qdrant as qdrant_svc

_PROMPT_TEMPLATE = (Path(__file__).parent.parent / "prompts" / "rag_system.txt").read_text(encoding="utf-8")
_ANTHROPIC_MODEL = "claude-sonnet-4-6"


def _build_context(chunks: list[SearchResult]) -> str:
    parts = []
    for i, c in enumerate(chunks, 1):
        parts.append(f"[{i}] (score={c.score:.3f}, file={c.filename})\n{c.text}")
    return "\n\n---\n\n".join(parts)


async def _resolve_template(db: object, collection_name: str) -> str:
    from services.database import get_system_prompt
    saved = await get_system_prompt(db, collection_name)  # type: ignore[arg-type]
    if saved and saved.strip():
        template = saved
        if "{context}" not in template:
            template += "\n\nContext:\n{context}"
        return template
    return _PROMPT_TEMPLATE


async def _build_system_prompt(db: object, collection_name: str, chunks: list[SearchResult]) -> str:
    context = _build_context(chunks)
    template = await _resolve_template(db, collection_name)
    return template.format(context=context)


async def run_stream(
    collection_name: str,
    request: RAGRequest,
    db: object = None,
) -> AsyncIterator[str]:
    """
    SSE 이벤트를 yield하는 async 제너레이터.
    각 yield는 'event: <name>\\ndata: <json>\\n\\n' 형식.
    """
    t_start = time.perf_counter()

    # 1. Retrieval
    query_dense = embedding.encode([request.query])[0]
    chunks, retrieval_latency = await qdrant_svc.search(
        collection_name=collection_name,
        query_dense=query_dense,
        query_text=request.query,
        top_k=request.top_k,
        mode=request.mode,
    )

    trace_retrieval = TraceRetrievalEvent(chunks=chunks, latency_ms=retrieval_latency)
    yield f"event: trace\ndata: {trace_retrieval.model_dump_json()}\n\n"

    # 2. Prompt building
    system_prompt = await _build_system_prompt(db, collection_name, chunks)
    # 간단한 토큰 수 추정 (4자 ≈ 1토큰)
    estimated_tokens = len(system_prompt) // 4 + len(request.query) // 4

    trace_prompt = TracePromptEvent(prompt=system_prompt, token_count=estimated_tokens)
    yield f"event: trace\ndata: {trace_prompt.model_dump_json()}\n\n"

    # 3. LLM 스트리밍
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    input_tokens = 0
    output_tokens = 0

    async with client.messages.stream(
        model=_ANTHROPIC_MODEL,
        max_tokens=2048,
        system=system_prompt,
        messages=[{"role": "user", "content": request.query}],
    ) as stream:
        async for text in stream.text_stream:
            token_event = TokenEvent(text=text)
            yield f"event: token\ndata: {token_event.model_dump_json()}\n\n"

        final = await stream.get_final_message()
        input_tokens = final.usage.input_tokens
        output_tokens = final.usage.output_tokens

    total_latency_ms = (time.perf_counter() - t_start) * 1000
    done_event = DoneEvent(
        total_latency_ms=total_latency_ms,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
    )
    yield f"event: done\ndata: {done_event.model_dump_json()}\n\n"


async def run_sync(
    collection_name: str,
    request: RAGRequest,
    db: object = None,
) -> RAGResponse:
    """테스트용 동기(논블로킹) RAG 실행. 전체 답변을 한 번에 반환."""
    t_start = time.perf_counter()

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    if request.include_no_rag:
        # 컨텍스트 없이 Claude 자체 지식만으로 답변
        chunks = []
        system_prompt = "You are a helpful assistant. Answer the user's question based on your own knowledge."
        message = await client.messages.create(
            model=_ANTHROPIC_MODEL,
            max_tokens=2048,
            system=system_prompt,
            messages=[{"role": "user", "content": request.query}],
        )
    else:
        query_dense = embedding.encode([request.query])[0]
        chunks, _ = await qdrant_svc.search(
            collection_name=collection_name,
            query_dense=query_dense,
            query_text=request.query,
            top_k=request.top_k,
            mode=request.mode,
        )
        system_prompt = await _build_system_prompt(db, collection_name, chunks)
        message = await client.messages.create(
            model=_ANTHROPIC_MODEL,
            max_tokens=2048,
            system=system_prompt,
            messages=[{"role": "user", "content": request.query}],
        )

    answer = message.content[0].text if message.content else ""
    total_latency_ms = (time.perf_counter() - t_start) * 1000

    return RAGResponse(
        answer=answer,
        chunks=chunks,
        prompt=system_prompt,
        input_tokens=message.usage.input_tokens,
        output_tokens=message.usage.output_tokens,
        total_latency_ms=total_latency_ms,
    )
