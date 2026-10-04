import numpy as np
from app.models.embeddings import get_embedding_manager


def test_embedding_shape_and_normalization():
    manager = get_embedding_manager()
    text = "Encapsulation bundles data and methods within a single class."
    vec = manager.encode(text)

    assert isinstance(vec, np.ndarray)
    assert len(vec) == 384
    norm = np.linalg.norm(vec)
    assert abs(norm - 1.0) < 1e-3


def test_cosine_similarity_identical_text():
    manager = get_embedding_manager()
    text = "Polymorphism enables an object to take on multiple forms."
    sim = manager.compute_similarity(text, text)
    assert abs(sim - 1.0) < 1e-3


def test_cosine_similarity_unrelated_text():
    manager = get_embedding_manager()
    text1 = "Photosynthesis occurs inside chloroplasts using chlorophyll."
    text2 = "PostgreSQL utilizes Write-Ahead Logging to guarantee transaction durability."
    sim = manager.compute_similarity(text1, text2)
    assert sim < 0.40


def test_reference_cache_reutilization():
    manager = get_embedding_manager()
    ref_text = "Unique reference answer for caching test in Examind."
    vec1 = manager.encode(ref_text, use_cache=True)
    vec2 = manager.encode(ref_text, use_cache=True)
    assert np.array_equal(vec1, vec2)
