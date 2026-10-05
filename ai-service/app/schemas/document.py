from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class ExtractedAnswer(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    questionNumber: int = Field(..., description="Detected question number")
    text: str = Field(..., description="Extracted answer content for the question")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Confidence score for this segmented answer")


class DocumentExtractionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    filename: str = Field(..., description="Original uploaded filename")
    pageCount: int = Field(default=1, description="Number of pages in the processed document")
    extractedText: str = Field(..., description="Full cleaned extracted text across all pages")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Overall OCR or extraction confidence score")
    provider: str = Field(..., description="OCR engine or extraction provider used")
    requiresReview: bool = Field(False, description="Flag indicating teacher review required due to low confidence or segmentation ambiguity")
    answers: List[ExtractedAnswer] = Field(default_factory=list, description="Structured segmented answers mapped to question numbers")
    warnings: List[str] = Field(default_factory=list, description="Any processing warnings, e.g. low confidence, handwriting limitations")
