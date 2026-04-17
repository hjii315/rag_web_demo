from contextlib import asynccontextmanager

import aiosqlite #프롬프트 관리
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import collections, documents, experiments, rag, search
from services.database import DB_PATH, init_db

#다른 API 요청을 동시에 처리해야되니깐 비동기로
@asynccontextmanager
async def lifespan(app: FastAPI):
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = await aiosqlite.connect(DB_PATH)
    await init_db(conn)
    app.state.db = conn
    yield
    await conn.close()

#fastapi 인스턴스
app = FastAPI(
    title="RAG Web Demo API",
    description="RAG 파이프라인 시각화 데모 — Qdrant + Claude + sentence-transformers",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(collections.router, prefix="/api", tags=["collections"])
app.include_router(documents.router, prefix="/api", tags=["documents"])
app.include_router(search.router, prefix="/api", tags=["search"])
app.include_router(rag.router, prefix="/api", tags=["rag"])
app.include_router(experiments.router, prefix="/api", tags=["experiments"])


@app.get("/health")
async def health():
    return {"status": "ok"}
