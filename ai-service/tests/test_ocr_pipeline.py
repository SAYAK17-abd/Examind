import io
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw
from app.main import app

client = TestClient(app)


def create_sample_document(text: str = "Q1. Polymorphism in Object-Oriented Programming enables code reusability.", fmt="PNG") -> io.BytesIO:
    img = Image.new("RGB", (600, 150), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((20, 50), text, fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    buf.seek(0)
    return buf


def test_ocr_extract_png_image():
    buf = create_sample_document("Q1. Polymorphism allows subclass method overriding at runtime.", fmt="PNG")

    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("student_answer_page1.png", buf.getvalue(), "image/png")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "student_answer_page1.png"
    assert "extractedText" in data
    assert len(data["extractedText"]) > 0
    assert "confidence" in data
    assert data["confidence"] > 0.0


def test_ocr_extract_jpg_image():
    buf = create_sample_document("Q2. Inheritance provides hierarchical code reuse.", fmt="JPEG")

    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("student_scan.jpg", buf.getvalue(), "image/jpeg")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "student_scan.jpg"
    assert "extractedText" in data
    assert data["confidence"] > 0.0


def test_ocr_empty_file_rejected():
    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("empty.png", b"", "image/png")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_ocr_legacy_endpoint_backward_compatible():
    buf = create_sample_document("Scanned document test content.", fmt="JPEG")

    response = client.post(
        "/ocr/extract",
        files={"file": ("scanned_page.jpg", buf.getvalue(), "image/jpeg")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "scanned_page.jpg"
    assert "extractedText" in data


def test_ocr_extracted_text_feeds_ai_evaluation():
    # 1. Extract text from uploaded document
    buf = create_sample_document("Encapsulation binds together code and data into a single unit.", fmt="PNG")

    ocr_resp = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("answer_sheet.png", buf.getvalue(), "image/png")}
    )
    assert ocr_resp.status_code == 200
    extracted_text = ocr_resp.json()["extractedText"]
    assert len(extracted_text) > 0

    # 2. Feed extracted text into evaluation pipeline
    eval_payload = {
        "evaluationId": "eval-ocr-chain-101",
        "question": "What is encapsulation in OOP?",
        "studentAnswer": extracted_text,
        "referenceAnswer": "Encapsulation binds together code and data into a single unit.",
        "maxMarks": 10.0
    }

    eval_resp = client.post("/api/v1/evaluate", json=eval_payload)
    assert eval_resp.status_code == 200
    eval_data = eval_resp.json()
    assert "score" in eval_data
    assert "confidence" in eval_data
    assert "feedback" in eval_data
    assert isinstance(eval_data["score"], (int, float))
