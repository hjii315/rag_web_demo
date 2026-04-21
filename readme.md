# RAG Web Demo

Qdrant + Claude + sentence-transformers 기반 RAG 파이프라인 시각화 데모

## 기술 스택

| 구분 | 기술 |
|------|------|
| Backend | FastAPI, Qdrant, sentence-transformers, Claude (Anthropic) |
| Frontend | React (TypeScript), Vite |
| DB | SQLite (프롬프트 관리), Qdrant (벡터 저장) |

## 주요 기능

- **Collections** — Qdrant 컬렉션 생성 / 삭제
- **Ingest** — PDF 업로드 → 파싱 → 청킹 → 임베딩 → Qdrant 저장
- **RAG** — 질의 → 유사 청크 검색 → Claude로 답변 생성

## 시작하기

### 1. Qdrant 실행

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend

# 처음 설치
uv venv --python 3.12
uv sync

# 실행
uv run uvicorn main:app --reload
```

### 3. Frontend

```bash
cd frontend

# 처음 설치
npm install

# 실행
npm run dev
```

## 환경 변수

`backend/.env` 파일을 생성하고 아래 값을 설정하세요.

```env
ANTHROPIC_API_KEY=your_api_key
```
