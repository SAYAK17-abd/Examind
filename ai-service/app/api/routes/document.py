from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, status, HTTPException
from app.core.security import verify_api_key
from app.pipelines.document_pipeline import get_document_pipeline, DocumentPipeline
from app.schemas.document import DocumentExtractionResponse, BulkDocumentExtractionResponse
from app.schemas.question_audit import QuestionPaperAuditResponse
from app.services.question_auditor import QuestionPaperAuditor

router = APIRouter(tags=["Document Ingestion, Bulk OCR & AI Question Audit"])


@router.post(
    "/api/v1/ocr/extract",
    response_model=DocumentExtractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract and segment text from a single student answer sheet",
    dependencies=[Depends(verify_api_key)]
)
async def extract_text_from_document(
    file: UploadFile = File(..., description="Uploaded student answer sheet (PDF, JPG, PNG)"),
    pipeline: DocumentPipeline = Depends(get_document_pipeline)
) -> DocumentExtractionResponse:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file must have a valid filename.")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    result_dict = await pipeline.process_document(file_bytes, file.filename)
    return DocumentExtractionResponse(**result_dict)


@router.post(
    "/api/v1/ocr/bulk-extract",
    response_model=BulkDocumentExtractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Batch extract and digitize bulk physical student answer sheets",
    dependencies=[Depends(verify_api_key)]
)
async def bulk_extract_documents(
    files: List[UploadFile] = File(..., description="Batch of scanned exam copies"),
    pipeline: DocumentPipeline = Depends(get_document_pipeline)
) -> BulkDocumentExtractionResponse:
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files uploaded.")

    extracted_docs: List[DocumentExtractionResponse] = []
    requires_review_count = 0

    for f in files:
        if not f.filename:
            continue
        content = await f.read()
        if len(content) == 0:
            continue
        try:
            res_dict = await pipeline.process_document(content, f.filename)
            doc_res = DocumentExtractionResponse(**res_dict)
            if doc_res.requiresReview:
                requires_review_count += 1
            extracted_docs.append(doc_res)
        except Exception as e:
            # Fallback for failed individual file in batch
            extracted_docs.append(DocumentExtractionResponse(
                filename=f.filename,
                studentIdentifier=None,
                pageCount=1,
                extractedText="",
                confidence=0.0,
                provider="error",
                requiresReview=True,
                answers=[],
                warnings=[f"Failed to process file: {str(e)}"]
            ))
            requires_review_count += 1

    return BulkDocumentExtractionResponse(
        totalFiles=len(files),
        successfulExtractions=len(extracted_docs),
        requiresReviewCount=requires_review_count,
        documents=extracted_docs
    )


@router.post(
    "/api/v1/questions/extract-and-audit",
    response_model=QuestionPaperAuditResponse,
    status_code=status.HTTP_200_OK,
    summary="OCR question paper, extract structured questions, and audit for mistakes and ambiguity",
    dependencies=[Depends(verify_api_key)]
)
async def extract_and_audit_question_paper(
    file: UploadFile = File(..., description="Scanned question paper (PDF or image)"),
    pipeline: DocumentPipeline = Depends(get_document_pipeline)
) -> QuestionPaperAuditResponse:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file must have a valid filename.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded question paper is empty.")

    # 1. OCR Extraction
    doc_res = await pipeline.process_document(content, file.filename)
    raw_extracted_text = doc_res.get("extractedText", "")

    # 2. Structural & Pedagogical Audit
    auditor = QuestionPaperAuditor()
    audit_report = auditor.parse_and_audit(raw_extracted_text, file.filename)

    return audit_report
