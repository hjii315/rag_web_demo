from __future__ import annotations

from functools import lru_cache

from sentence_transformers import SentenceTransformer

MODEL_NAME = "jhgan/ko-sroberta-multitask"

_model_instance = None

def _get_model() -> SentenceTransformer:
    global _model_instance
    if _model_instance is None:
        _model_instance = SentenceTransformer(MODEL_NAME)
    return _model_instance


def encode(texts: list[str]) -> list[list[float]]:
    model = _get_model()
    vectors = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    return vectors.tolist()