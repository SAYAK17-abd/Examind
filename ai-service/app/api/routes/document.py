from fastapi import APIRouter, UploadFile, File, Depends, status, HTTPException
from app.core.security import verify_api_key
from app.pipelines.document_pipeline import get_document_pipeline, DocumentPipeline
from app.schemas.document import DocumentExtractionResponse

router = APIRouter(tags=["Document Ingestion & OCR"])


@router.post(
    "/api/v1/ocr/extract",
    response_model=DocumentExtractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract and segment text from uploaded student answer sheet (PDF or Image)",
    description="Validates the file, performs image preprocessing/OCR or digital extraction, segments answers into structured questions, and flags confidence.",
    dependencies=[Depends(verify_api_key)]
)
async def extract_text_from_document(
    file: UploadFile = File(..., description="Uploaded student answer sheet (PDF, JPG, PNG)"),
    pipeline: DocumentPipeline = Depends(get_document_pipeline)
) -> DocumentExtractionResponse:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename."
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    result_dict = await pipeline.process_document(file_bytes, file.filename)
    return DocumentExtractionResponse(**result_dict)
