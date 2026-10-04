import re
from typing import List, Tuple
import numpy as np
from app.models.embeddings import get_embedding_manager, EmbeddingModelManager
from app.core.logging import logger
from app.utils.text import normalize_text


class SemanticService:
    """
    Evaluates semantic similarity between student responses and reference answers
    using Sentence Transformers and multi-level vector analysis.
    """

    def __init__(self, embedding_manager: EmbeddingModelManager | None = None):
        self.embedding_manager = embedding_manager or get_embedding_manager()

    def split_sentences(self, text: str) -> List[str]:
        """Splits text into meaningful sentence chunks for granular alignment."""
        cleaned = normalize_text(text)
        if not cleaned:
            return []
        # Split on sentence terminators while preserving code or short expressions
        raw_sentences = re.split(r"(?<=[.!?])\s+|\n+", cleaned)
        sentences = [s.strip() for s in raw_sentences if len(s.strip()) > 5]
        return sentences if sentences else [cleaned]

    def compute_semantic_similarity(
        self,
        student_answer: str,
        reference_answer: str
    ) -> float:
        """
        Computes holistic semantic similarity between student and reference answer.
        Combines document-level cosine similarity with sentence-level alignment coverage.
        """
        student_clean = normalize_text(student_answer)
        ref_clean = normalize_text(reference_answer)

        if not student_clean or not ref_clean:
            return 0.0

        # 1. Document-level similarity
        doc_similarity = self.embedding_manager.compute_similarity(student_clean, ref_clean)

        # 2. Granular Sentence-level Alignment
        ref_sentences = self.split_sentences(ref_clean)
        student_sentences = self.split_sentences(student_clean)

        if len(ref_sentences) <= 1 or len(student_sentences) <= 1:
            return round(doc_similarity, 3)

        ref_vectors = self.embedding_manager.encode(ref_sentences)
        student_vectors = self.embedding_manager.encode(student_sentences)

        # Compute pairwise cosine similarity matrix
        # Shape: (len(ref_sentences), len(student_sentences))
        similarity_matrix = np.dot(ref_vectors, student_vectors.T)

        # For each reference sentence, find best matching student sentence
        max_matches_per_ref = np.max(similarity_matrix, axis=1)
        sentence_coverage = float(np.mean(max_matches_per_ref))

        # Blended score: 60% document holistic context + 40% sentence-level coverage
        blended_score = (0.60 * doc_similarity) + (0.40 * sentence_coverage)
        clamped_score = max(0.0, min(1.0, blended_score))

        return round(clamped_score, 3)


_semantic_service_instance: SemanticService | None = None


def get_semantic_service() -> SemanticService:
    """Singleton getter for SemanticService."""
    global _semantic_service_instance
    if _semantic_service_instance is None:
        _semantic_service_instance = SemanticService()
    return _semantic_service_instance
