from app.services.semantic_service import get_semantic_service


def test_paraphrased_answer_high_semantic_similarity():
    service = get_semantic_service()
    ref = "Polymorphism allows the same interface to represent different underlying forms through method overriding and overloading."
    student = "An object can behave differently depending on the situation through overriding and overloading methods."

    sim = service.compute_semantic_similarity(student, ref)
    # Paraphrased answer must have strong semantic similarity despite differing wording
    assert sim > 0.50


def test_completely_irrelevant_answer_low_similarity():
    service = get_semantic_service()
    ref = "Encapsulation restricts direct access to some of an object's components."
    student = "The capital of France is Paris and the Eiffel Tower is very tall."

    sim = service.compute_semantic_similarity(student, ref)
    assert sim < 0.40


def test_empty_answer_zero_similarity():
    service = get_semantic_service()
    sim = service.compute_semantic_similarity("", "Sample reference answer.")
    assert sim == 0.0
