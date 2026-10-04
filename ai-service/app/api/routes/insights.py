from collections import Counter
from fastapi import APIRouter, Depends, status
from app.core.security import verify_api_key
from app.schemas.insights import StudentInsightsRequest, StudentInsightsResponse

router = APIRouter(tags=["Learning Insights & Analytics"])


@router.post(
    "/api/v1/insights/student",
    response_model=StudentInsightsResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate personalized student learning insights",
    dependencies=[Depends(verify_api_key)]
)
async def generate_student_insights(req: StudentInsightsRequest) -> StudentInsightsResponse:
    if not req.evaluations:
        return StudentInsightsResponse(
            studentId=req.studentId,
            strongTopics=[],
            weakTopics=[],
            commonMistakes=[],
            recommendedRevision=[],
            overallMasteryRate=0.0
        )

    topic_scores = {}
    missing_counter = Counter()

    total_score = 0.0
    total_max = 0.0

    for item in req.evaluations:
        topic = item.topic or item.subject or "General"
        if topic not in topic_scores:
            topic_scores[topic] = {"scored": 0.0, "max": 0.0}
        topic_scores[topic]["scored"] += item.score
        topic_scores[topic]["max"] += item.maxMarks

        total_score += item.score
        total_max += item.maxMarks

        for m in item.missingConcepts:
            missing_counter[m] += 1

    strong_topics = [
        t for t, data in topic_scores.items()
        if (data["max"] > 0 and (data["scored"] / data["max"]) >= 0.75)
    ]
    weak_topics = [
        t for t, data in topic_scores.items()
        if (data["max"] > 0 and (data["scored"] / data["max"]) < 0.60)
    ]

    common_mistakes = [concept for concept, count in missing_counter.most_common(3)]
    recommendations = [f"Review core principles of: {c}" for c in common_mistakes]

    overall_mastery = round(total_score / max(1.0, total_max), 2)

    return StudentInsightsResponse(
        studentId=req.studentId,
        strongTopics=strong_topics,
        weakTopics=weak_topics,
        commonMistakes=common_mistakes,
        recommendedRevision=recommendations,
        overallMasteryRate=overall_mastery
    )

