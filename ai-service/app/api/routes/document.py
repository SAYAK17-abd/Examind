from fastapi import APIRouter, UploadFile, File, Depends, status, HTTPException
from app.core.security import verify_api_key
from app.pipelines.document_pipeline import get_document_pipeline, DocumentPipeline

router = APIRouter(tags=["Document Ingestion & OCR"])


@router.post(
    "/api/v1/ocr/extract",
    status_code=status.HTTP_200_OK,
    summary="Extract text from uploaded student answer sheet (PDF or Image)",
    description="Preprocesses the document/image, executes OCR, and returns clean transcript.",
    dependencies=[Depends(verify_api_key)]
)
async def extract_text_from_document(
    file: UploadFile = File(..., description="Uploaded student answer sheet (PDF, JPG, PNG)"),
    pipeline: DocumentPipeline = Depends(get_document_pipeline)
):
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

    return await pipeline.process_document(file_bytes, file.filename)

