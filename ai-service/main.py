import os
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel

app = FastAPI(title="EXAMIND AI Evaluation & OCR Service", version="1.0.0")

class RubricCriterion(BaseModel):
    criterion: str
    maxMarks: float

class EvaluationRequest(BaseModel):
    question: str
    studentAnswer: str
    referenceAnswer: Optional[str] = None
    maxScore: float
    rubric: Optional[List[RubricCriterion]] = []

class EvaluationResponse(BaseModel):
    score: float
    confidence: float
    correctness: float
    completeness: float
    semanticSimilarity: float
    conceptCoverage: float
    feedback: str

@app.get("/health")
def health_check():
    return {"status": "UP", "service": "examind-ai-service"}

@app.post("/evaluate", response_model=EvaluationResponse)
def evaluate_answer(req: EvaluationRequest):
    if not req.studentAnswer or len(req.studentAnswer.strip()) == 0:
        return EvaluationResponse(
            score=0.0,
            confidence=0.99,
            correctness=0.0,
            completeness=0.0,
            semanticSimilarity=0.0,
            conceptCoverage=0.0,
            feedback="No answer was provided."
        )

    # Word-level overlap analysis
    ans_words = set(req.studentAnswer.lower().split())
    ref_words = set(req.referenceAnswer.lower().split()) if req.referenceAnswer else set()

    overlap = len(ans_words.intersection(ref_words)) / max(len(ref_words), 1) if ref_words else 0.8
    correctness = min(1.0, 0.4 + (overlap * 0.6))
    completeness = min(1.0, len(ans_words) / 30.0)
    score = round(req.maxScore * ((correctness * 0.6) + (completeness * 0.4)), 1)
    confidence = 0.88 if len(ans_words) >= 10 else 0.70

    return EvaluationResponse(
        score=min(req.maxScore, score),
        confidence=confidence,
        correctness=round(correctness, 2),
        completeness=round(completeness, 2),
        semanticSimilarity=round(overlap, 2),
        conceptCoverage=round(correctness, 2),
        feedback="Demonstrates sound conceptual grasp with clear explanation."
    )

@app.post("/ocr/extract")
async def extract_text_from_file(file: UploadFile = File(...)):
    return {
        "filename": file.filename,
        "extractedText": "Sample OCR extracted text from uploaded student answer sheet."
    }
