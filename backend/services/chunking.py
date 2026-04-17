from __future__ import annotations

import re

import nltk
from nltk.tokenize import sent_tokenize

from models.schemas import Chunk, ChunkingConfig

# NLTK 리소스 다운로드 (처음 실행시만)
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)


def chunk(text: str, config: ChunkingConfig) -> list[Chunk]:
    """설정에 따라 텍스트를 청크 목록으로 분할."""
    if config.strategy == "fixed":
        raw = _fixed(text, config.chunk_size, config.overlap)
    elif config.strategy == "sentence":
        raw = _sentence(text, config.chunk_size, config.overlap)
    else:
        raw = _recursive(text, config.chunk_size, config.overlap)

    return [
        Chunk(index=i, text=t, char_count=len(t))
        for i, t in enumerate(raw)
        if t.strip()
    ]


# ── Fixed ─────────────────────────────────────────────────────────────────────

def _fixed(text: str, size: int, overlap: int) -> list[str]:
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start += size - overlap #오버랩만큼 뒤로 물러났다가 다시 시작
        if start < 0:
            break
    return chunks


# ── Sentence ──────────────────────────────────────────────────────────────────

def _sentence(text: str, size: int, overlap: int) -> list[str]:
    sentences = sent_tokenize(text)
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for sent in sentences:
        sent_len = len(sent)
        if current_len + sent_len > size and current:
            chunks.append(" ".join(current))
            overlap_sentences: list[str] = []
            overlap_len = 0
            for s in reversed(current):
                if overlap_len + len(s) <= overlap:
                    overlap_sentences.insert(0, s)
                    overlap_len += len(s)
                else:
                    break
            current = overlap_sentences
            current_len = overlap_len

        current.append(sent)
        current_len += sent_len

    if current:
        chunks.append(" ".join(current))

    return chunks


# ── Recursive ────────────────────────────────────────────────────────────────

_SEPARATORS = ["\n\n", "\n", ". ", " "]

#depth=0: "\n\n" (단락)으로 먼저 분리 시도
#→ 여전히 너무 크면
#depth=1: "\n" (줄바꿈)으로 분리 시도
#→ 여전히 너무 크면
#depth=2: ". " (문장)으로 분리 시도
#→ 여전히 너무 크면
#depth=3: " " (단어)로 분리

def _recursive(text: str, size: int, overlap: int, depth: int = 0) -> list[str]:
    if len(text) <= size:
        return [text]

    #sep = 구분자
    sep = _SEPARATORS[min(depth, len(_SEPARATORS) - 1)]
    parts = re.split(re.escape(sep), text)

    chunks: list[str] = []
    current = ""

    for part in parts:
        candidate = (current + sep + part).lstrip(sep) if current else part
        if len(candidate) <= size:
            current = candidate
        else:
            if current:
                chunks.append(current)
                if overlap > 0 and len(current) > overlap:
                    current = current[-overlap:] + sep + part
                else:
                    current = part
            else:
#depth=0, sep="\n\n"  으로 쪼갰는데
#어떤 part 하나가 size=500 인데 혼자 크기가 800 임
#→ current에 넣지도 못하고, current도 비어있음
#→ 이 part를 더 잘게 쪼개야 함
#→ depth+1 로 재귀! (다음 구분자 "\n" 시도)
                sub = _recursive(part, size, overlap, depth + 1)
                chunks.extend(sub[:-1])
                current = sub[-1] if sub else ""

    if current:
        chunks.append(current)

    return chunks
