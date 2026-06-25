import io
from pathlib import Path
import sys

import cv2
import numpy as np

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app import create_app  # noqa: E402


class FakeScoreModel:
    def predict(self, tensor, verbose=0):
        return np.array([[0.05, 0.95]], dtype=np.float32)


def build_client():
    fake_backend = {
        "backend": "keras_score",
        "model": FakeScoreModel(),
        "label_map": {
            "0": "score_1",
            "1": "score_2",
        },
    }
    app = create_app(fake_backend)
    app.config.update(TESTING=True)
    return app.test_client()


def test_health_returns_ok():
    client = build_client()

    response = client.get("/health")

    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


def test_predict_requires_file():
    client = build_client()

    response = client.post("/predict", data={}, content_type="multipart/form-data")

    assert response.status_code == 400
    assert response.get_json()["error"] == "No file provided"


def test_predict_rejects_invalid_image():
    client = build_client()

    response = client.post(
        "/predict",
        data={"file": (io.BytesIO(b"not-an-image"), "leaf.txt")},
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "Invalid image"


def test_predict_returns_prediction_for_valid_image():
    client = build_client()
    image = np.zeros((32, 32, 3), dtype=np.uint8)
    image[:, :] = (40, 160, 80)
    success, encoded = cv2.imencode(".png", image)
    assert success
    png_bytes = encoded.tobytes()

    response = client.post(
        "/predict",
        data={"file": (io.BytesIO(png_bytes), "leaf.png")},
        content_type="multipart/form-data",
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["prediction"] == "score_2"
    assert payload["backend"] == "keras_score"
    assert payload["predictedScore"] == 2
