import re
from typing import List, Tuple, Dict, Set
import numpy as np
from app.models.embeddings import get_embedding_manager, EmbeddingModelManager
from app.core.logging import logger
from app.utils.text import normalize_text, extract_keywords_and_tokens


# Common technical acronyms and synonym expansions
DOMAIN_SYNONYMS: Dict[str, List[str]] = {
    "runtime polymorphism": ["dynamic method dispatch", "method overriding", "dynamic binding", "late binding"],
    "compile-time polymorphism": ["method overloading", "static polymorphism", "early binding", "static binding"],
    "method overriding": ["runtime polymorphism", "override method", "subclass implementation"],
    "method overloading": ["compile-time polymorphism", "overload method", "same method name different parameters"],
    "garbage collection": ["gc", "memory reclamation", "automatic memory management", "clean unreachable objects"],
    "encapsulation": ["data hiding", "private fields", "getters and setters", "bundling data and methods"],
    "inheritance": ["subclassing", "derived class", "extends", "parent child class relationship"],
    "abstraction": ["abstract class", "interfaces", "hiding implementation details"],
    "multithreading": ["concurrency", "thread execution", "parallel execution", "thread lifecycle"],
}


class ConceptService:
    """
    Semantic Concept Extraction and Coverage Evaluation Service.
    Uses vector embeddings to detect whether expected technical concepts are
    present in the student's answer even when phrased with synonyms or different structures.
    """

    def __init__(
        self,
        embedding_manager: EmbeddingModelManager | None = None,
        similarity_threshold: float = 0.65
    ):
        self.embedding_manager = embedding_manager or get_embedding_manager()
        self.similarity_threshold = similarity_threshold

    def segment_answer(self, text: str) -> List[str]:
        """Segments text into clauses and sentences for granular semantic matching."""
        cleaned = normalize_text(text)
        if not cleaned:
            return []
        # Split on sentence terminators and semicolons
        chunks = re.split(r"[.!?;\n]+", cleaned)
        valid_chunks = [c.strip() for c in chunks if len(c.strip()) > 3]
        return valid_chunks if valid_chunks else [cleaned]

    def detect_concepts(
        self,
        student_answer: str,
        expected_concepts: List[str],
        reference_answer: str = "",
        threshold: float | None = None
    ) -> Tuple[List[str], List[str], float]:
        """
        Detects which expected concepts are covered vs missing in the student answer.
        Returns (detected_concepts, missing_concepts, concept_coverage_ratio).
        """
        if not expected_concepts:
            return [], [], 1.0

        student_clean = normalize_text(student_answer)
        if not student_clean:
            return [], list(expected_concepts), 0.0

        cutoff = threshold if threshold is not None else self.similarity_threshold
        student_chunks = self.segment_answer(student_clean)
        student_lower = student_clean.lower()
        student_tokens = set(extract_keywords_and_tokens(student_clean))

        # Encode all student chunks into vectors
        chunk_vectors = self.embedding_manager.encode(student_chunks)
        if chunk_vectors.ndim == 1:
            chunk_vectors = chunk_vectors.reshape(1, -1)

        detected: List[str] = []
        missing: List[str] = []

        for concept in expected_concepts:
            concept_clean = concept.strip()
            concept_lower = concept_clean.lower()
            concept_tokens = set(extract_keywords_and_tokens(concept_clean))

            # 1. Direct surface match / keyword check (fast path)
            if concept_lower in student_lower or (concept_tokens and concept_tokens.issubset(student_tokens)):
                detected.append(concept_clean)
                continue

            # 2. Check known domain synonyms
            synonyms = DOMAIN_SYNONYMS.get(concept_lower, [])
            synonym_found = any(syn in student_lower for syn in synonyms)
            if synonym_found:
                detected.append(concept_clean)
                continue

            # 3. Vector Embedding Semantic Matching
            concept_vector = self.embedding_manager.encode(concept_clean)
            if concept_vector.ndim == 1:
                concept_vector = concept_vector.reshape(1, -1)

            # Cosine similarity against each student chunk
            # chunk_vectors: (N, D), concept_vector: (1, D)
            sims = np.dot(chunk_vectors, concept_vector.T).flatten()
            max_similarity = float(np.max(sims)) if len(sims) > 0 else 0.0

            if max_similarity >= cutoff:
                detected.append(concept_clean)
            else:
                missing.append(concept_clean)

        coverage = round(len(detected) / max(1, len(expected_concepts)), 3)
        return detected, missing, coverage


_concept_service_instance: ConceptService | None = None


def get_concept_service() -> ConceptService:
    """Singleton getter for ConceptService."""
    global _concept_service_instance
    if _concept_service_instance is None:
        _concept_service_instance = ConceptService()
    return _concept_service_instance
