import asyncio
import numpy as np
from app.pipelines.evaluation_pipeline import get_evaluation_pipeline
from app.schemas.evaluation import EvaluationRequest, RubricCriterion


BENCHMARK_DATASET = [
    {
        "id": "bench-1-perfect",
        "question": "What is method overriding in Java?",
        "studentAnswer": "Method overriding allows a subclass to provide a specific implementation of a method that is already defined in its superclass, enabling runtime polymorphism.",
        "referenceAnswer": "Method overriding is when a subclass redefines a superclass method for runtime polymorphism.",
        "maxMarks": 10.0,
        "expectedConcepts": ["subclass", "superclass", "runtime polymorphism"],
        "expectedScoreMin": 8.0,
        "expectedScoreMax": 10.0
    },
    {
        "id": "bench-2-partial",
        "question": "Explain encapsulation.",
        "studentAnswer": "Encapsulation uses private variables in a class.",
        "referenceAnswer": "Encapsulation binds data and code together into a single unit, hiding internal state using private variables and public methods.",
        "maxMarks": 10.0,
        "expectedConcepts": ["private variables", "data hiding", "methods"],
        "expectedScoreMin": 3.0,
        "expectedScoreMax": 7.0
    },
    {
        "id": "bench-3-blank",
        "question": "Explain JVM memory architecture.",
        "studentAnswer": "",
        "referenceAnswer": "JVM memory consists of Heap, Stack, Method Area, and PC Register.",
        "maxMarks": 10.0,
        "expectedConcepts": ["heap", "stack", "method area"],
        "expectedScoreMin": 0.0,
        "expectedScoreMax": 0.0
    },
    {
        "id": "bench-4-misconception",
        "question": "Does Java support multiple inheritance through classes?",
        "studentAnswer": "Yes, Java supports multiple inheritance through classes so a child can have multiple parents.",
        "referenceAnswer": "Java does not support multiple inheritance through classes to avoid the diamond problem.",
        "maxMarks": 10.0,
        "expectedConcepts": ["multiple inheritance", "interfaces"],
        "expectedScoreMin": 0.0,
        "expectedScoreMax": 4.5
    },
    {
        "id": "bench-5-paraphrase",
        "question": "What is polymorphism?",
        "studentAnswer": "It means the capability of an entity to take different configurations or behave uniquely under different conditions.",
        "referenceAnswer": "Polymorphism allows one entity or interface to take multiple forms.",
        "maxMarks": 10.0,
        "expectedConcepts": ["multiple forms", "interface"],
        "expectedScoreMin": 4.0,
        "expectedScoreMax": 9.5
    }
]


def test_benchmark_evaluation_suite():
    pipeline = get_evaluation_pipeline()

    predicted_scores = []
    target_midpoints = []
    concept_accuracies = []

    for item in BENCHMARK_DATASET:
        req = EvaluationRequest(
            evaluationId=item["id"],
            question=item["question"],
            studentAnswer=item["studentAnswer"],
            referenceAnswer=item["referenceAnswer"],
            maxMarks=item["maxMarks"],
            expectedConcepts=item["expectedConcepts"]
        )

        res = asyncio.run(pipeline.execute(req))
        predicted = res.score
        min_s = item["expectedScoreMin"]
        max_s = item["expectedScoreMax"]

        # Assert score falls within expected pedagogical bounds
        assert min_s <= predicted <= max_s, f"Failed on {item['id']}: score {predicted} not in [{min_s}, {max_s}]"

        predicted_scores.append(predicted)
        target_midpoints.append((min_s + max_s) / 2.0)

        # Concept detection check
        expected_set = set(item["expectedConcepts"])
        detected_set = set(res.detectedConcepts)
        accuracy = len(detected_set.intersection(expected_set)) / max(1, len(expected_set))
        concept_accuracies.append(accuracy)

    # Calculate statistical metrics across benchmark
    errors = np.array(predicted_scores) - np.array(target_midpoints)
    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    mean_concept_acc = float(np.mean(concept_accuracies))

    # Pedagogical sanity checks
    assert mae < 2.5
    assert rmse < 3.0
    assert mean_concept_acc >= 0.35
