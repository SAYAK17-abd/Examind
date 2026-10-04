import hashlib
from typing import List, Union, Dict, Optional
import numpy as np
from app.core.config import get_settings
from app.core.logging import logger

try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False


class EmbeddingModelManager:
    """
    Singleton Manager for Sentence Transformer Embeddings.
    Handles lazy initialization, batching, cosine similarity,
    and LRU-style caching for reference answers.
    """

    _instance: Optional["EmbeddingModelManager"] = None
    _model = None
    _reference_cache: Dict[str, np.ndarray] = {}
    _cache_limit: int = 500

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingModelManager, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.settings = get_settings()
        self.model_name = self.settings.EMBEDDING_MODEL
        self._is_ready = False
        self.load_model()

    def load_model(self) -> bool:
        """Loads the SentenceTransformer model into memory."""
        if self._model is not None:
            return True

        if not HAS_SENTENCE_TRANSFORMERS:
            logger.warning("sentence-transformers package not available. Using fallback embeddings.")
            return False

        try:
            logger.info(f"Loading SentenceTransformer model: '{self.model_name}'...")
            self._model = SentenceTransformer(self.model_name)
            self._is_ready = True
            logger.info(f"SentenceTransformer '{self.model_name}' loaded successfully.")
            return True
        except Exception as ex:
            logger.error(f"Failed to load SentenceTransformer '{self.model_name}': {ex}. Using fallback.")
            self._model = None
            self._is_ready = False
            return False

    def is_loaded(self) -> bool:
        return self._model is not None

    def _fallback_encode(self, text: str, dim: int = 384) -> np.ndarray:
        """
        Deterministic, robust fallback embedding generator for testing and offline environments.
        Produces unit-normalized 384-dimensional dense vectors using hashed character & word n-grams.
        """
        if not text:
            return np.zeros(dim, dtype=np.float32)

        vec = np.zeros(dim, dtype=np.float32)
        words = text.lower().split()
        for i, word in enumerate(words):
            h = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
            idx = h % dim
            weight = 1.0 / (1.0 + (i * 0.05))
            vec[idx] += weight

        norm = np.linalg.norm(vec)
        if norm > 1e-6:
            vec = vec / norm
        return vec

    def encode(self, texts: Union[str, List[str]], use_cache: bool = False) -> np.ndarray:
        """
        Encodes one or more texts into normalized dense vectors.
        Supports caching for reference answers.
        """
        single_input = isinstance(texts, str)
        text_list = [texts] if single_input else texts

        # Check cache if single input requested with caching
        if single_input and use_cache:
            cache_key = hashlib.md5(texts.encode("utf-8")).hexdigest()
            if cache_key in self._reference_cache:
                return self._reference_cache[cache_key]

        if self._model is not None:
            try:
                embeddings = self._model.encode(
                    text_list,
                    convert_to_numpy=True,
                    normalize_embeddings=True
                )
                if single_input:
                    res = embeddings[0]
                    if use_cache:
                        self._put_cache(cache_key, res)
                    return res
                return embeddings
            except Exception as e:
                logger.error(f"Error during SentenceTransformer encoding: {e}. Falling back.")

        # Fallback path
        fallback_vecs = np.array([self._fallback_encode(t) for t in text_list], dtype=np.float32)
        if single_input:
            res = fallback_vecs[0]
            if use_cache:
                self._put_cache(cache_key, res)
            return res
        return fallback_vecs

    def _put_cache(self, key: str, vec: np.ndarray):
        if len(self._reference_cache) >= self._cache_limit:
            # Drop earliest added item
            first_key = next(iter(self._reference_cache))
            del self._reference_cache[first_key]
        self._reference_cache[key] = vec

    @staticmethod
    def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Computes cosine similarity between two 1D normalized or unnormalized vectors."""
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        if norm1 < 1e-6 or norm2 < 1e-6:
            return 0.0
        cos_sim = np.dot(vec1, vec2) / (norm1 * norm2)
        return float(np.clip(cos_sim, 0.0, 1.0))

    def compute_similarity(self, text1: str, text2: str) -> float:
        """Convenience method to compute semantic similarity between two texts."""
        if not text1.strip() or not text2.strip():
            return 0.0
        vec1 = self.encode(text1)
        vec2 = self.encode(text2, use_cache=True)
        return self.cosine_similarity(vec1, vec2)


def get_embedding_manager() -> EmbeddingModelManager:
    """Returns singleton EmbeddingModelManager instance."""
    return EmbeddingModelManager()
