from app.models.embeddings import get_embedding_manager, EmbeddingModelManager
from app.schemas.similarity import SimilarityCheckRequest, SimilarityCheckResponse
from app.utils.text import normalize_text


class SimilarityService:
    """
    Evaluates pairwise similarity between student submissions using
    Sentence Transformer vector embeddings.
    """

    def __init__(self, embedding_manager: EmbeddingModelManager | None = None):
        self.embedding_manager = embedding_manager or get_embedding_manager()

    def check_pairwise_similarity(self, req: SimilarityCheckRequest) -> SimilarityCheckResponse:
        ans1 = normalize_text(req.answer1)
        ans2 = normalize_text(req.answer2)

        if not ans1 or not ans2:
            return SimilarityCheckResponse(
                similarity=0.0,
                possibleSimilarity=False,
                rationale="One or both submissions contain insufficient content for semantic comparison."
            )

        # Compute cosine similarity using SentenceTransformer embeddings
        vec1 = self.embedding_manager.encode(ans1)
        vec2 = self.embedding_manager.encode(ans2)

        similarity_score = round(self.embedding_manager.cosine_similarity(vec1, vec2), 3)
        is_potentially_similar = similarity_score >= req.threshold

        if is_potentially_similar:
            rationale = (
                f"High semantic convergence detected (cosine similarity {similarity_score:.2f} >= threshold {req.threshold:.2f}). "
                "Marked as 'Potentially Similar' for instructor review. Final determination rests with the educator."
            )
        else:
            rationale = (
                f"Semantic similarity is within typical independent academic variance (similarity {similarity_score:.2f} < threshold {req.threshold:.2f})."
            )

        return SimilarityCheckResponse(
            similarity=similarity_score,
            possibleSimilarity=is_potentially_similar,
            rationale=rationale
        )


_similarity_service_instance: SimilarityService | None = None


def get_similarity_service() -> SimilarityService:
    """Singleton getter for SimilarityService."""
    global _similarity_service_instance
    if _similarity_service_instance is None:
        _similarity_service_instance = SimilarityService()
    return _similarity_service_instance
