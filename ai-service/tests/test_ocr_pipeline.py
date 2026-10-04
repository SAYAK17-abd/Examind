import io
from fastapi.testclient import TestClient
from PIL import Image
from app.main import app

client = TestClient(app)


def test_ocr_extract_image_upload():
    # Create an in-memory sample PNG image
    img = Image.new("RGB", (100, 50), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("test_answer_sheet.png", buf.getvalue(), "image/png")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test_answer_sheet.png"
    assert "extractedText" in data
    assert len(data["extractedText"]) > 0
    assert "confidence" in data
    assert data["confidence"] > 0.0


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


def test_ocr_empty_file_rejected():
    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("empty.png", b"", "image/png")}
    )
    assert response.status_code == 400

