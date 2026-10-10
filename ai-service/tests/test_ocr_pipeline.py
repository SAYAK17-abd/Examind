import io
from fastapi.testclient import TestClient
from PIL import Image
from app.main import app

client = TestClient(app)


def test_ocr_extract_png_image():
    img = Image.new("RGB", (120, 60), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

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
    img = Image.new("RGB", (100, 50), color=(245, 245, 245))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

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
    img = Image.new("RGB", (60, 30), color=(240, 240, 240))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

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
    img = Image.new("RGB", (100, 50), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")

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

