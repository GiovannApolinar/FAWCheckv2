import importlib
import json
import joblib
import os
import site
import tempfile
from pathlib import Path

import cv2
import numpy as np
from flask import Flask, jsonify, request

APP_DIR = Path(__file__).resolve().parent
DEFAULT_IMAGE_SIZE = (224, 224)
DEFAULT_LABEL_MAP = {str(index): f"score_{index + 1}" for index in range(9)}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def _first_existing_path(candidates):
    for candidate in candidates:
        if candidate and candidate.exists():
            return candidate
    return None


def _resolve_model_path():
    configured_model_path = os.environ.get("FAWCHECK_MODEL_PATH")
    if configured_model_path:
        model_path = Path(configured_model_path)
        if not model_path.exists():
            raise RuntimeError(f"Configured model path '{model_path}' does not exist.")
        return model_path

    bundled_model = _first_existing_path(
        [
            APP_DIR / "models" / "fawcheck_finetuned.keras",
            APP_DIR / "saved_models" / "fawcheck_finetuned.keras",
            APP_DIR / "models" / "maize_model.pkl",
            APP_DIR / "maize_model.pkl",
        ]
    )

    if bundled_model is None:
        raise RuntimeError("No inference model found. Set FAWCHECK_MODEL_PATH to a packaged model inside the container.")

    return bundled_model


def _resolve_label_map_path(model_path):
    configured_label_map_path = os.environ.get("FAWCHECK_LABEL_MAP_PATH")
    if configured_label_map_path:
        label_map_path = Path(configured_label_map_path)
        if not label_map_path.exists():
            raise RuntimeError(f"Configured label map path '{label_map_path}' does not exist.")
        return label_map_path

    return _first_existing_path(
        [
            APP_DIR / "models" / "label_map.json",
            APP_DIR / "label_map.json",
            model_path.parent / "label_map.json",
        ]
    )


def _import_tensorflow(model_path):
    try:
        return importlib.import_module("tensorflow")
    except ImportError:
        extra_site_packages = model_path.parent.parent / ".venv" / "Lib" / "site-packages"
        if extra_site_packages.exists():
            site.addsitedir(str(extra_site_packages))
            return importlib.import_module("tensorflow")
        raise RuntimeError(
            f"TensorFlow is required to load the Keras model at '{model_path}', "
            "but it was not available in the current Python environment."
        )


def _load_label_map(label_map_path):
    if label_map_path is None:
        return DEFAULT_LABEL_MAP

    with label_map_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    return {str(key): str(value).strip().lower().replace(" ", "_") for key, value in payload.items()}


def _load_legacy_model(model_path):
    return {
        "backend": "sklearn_binary",
        "model": joblib.load(model_path),
        "label_map": None,
    }


def _load_keras_model(model_path):
    tf = _import_tensorflow(model_path)
    label_map = _load_label_map(_resolve_label_map_path(model_path))
    return {
        "backend": "keras_score",
        "model": tf.keras.models.load_model(model_path),
        "label_map": label_map,
    }


def load_inference_backend():
    model_path = _resolve_model_path()
    suffix = model_path.suffix.lower()

    if suffix == ".keras":
        return _load_keras_model(model_path)

    if suffix == ".pkl":
        return _load_legacy_model(model_path)

    raise RuntimeError(f"Unsupported model format '{model_path.suffix}'.")


def extract_features(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return None
    img = cv2.resize(img, (128, 128))
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hist = cv2.calcHist([gray], [0], None, [64], [0, 256])
    hist = cv2.normalize(hist, hist).flatten()
    edges = cv2.Canny(gray, 100, 200)
    edge_density = np.sum(edges) / (128 * 128)
    features = np.append(hist, edge_density)
    return features


def load_score_model_input(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return None

    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, DEFAULT_IMAGE_SIZE)
    return np.expand_dims(img.astype(np.float32), axis=0)


def predict_score(inference_backend, image_path):
    tensor = load_score_model_input(image_path)
    if tensor is None:
        return None

    model = inference_backend["model"]
    label_map = inference_backend["label_map"] or DEFAULT_LABEL_MAP
    probabilities = model.predict(tensor, verbose=0)[0]
    top_index = int(np.argmax(probabilities))
    prediction = label_map.get(str(top_index), f"score_{top_index + 1}")
    confidence = float(probabilities[top_index]) * 100.0
    return prediction, confidence, top_index + 1


def create_app(inference_backend=None):
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES
    app.config["INFERENCE_BACKEND"] = inference_backend

    def get_inference_backend():
        backend = app.config.get("INFERENCE_BACKEND")
        if backend is None:
            backend = load_inference_backend()
            app.config["INFERENCE_BACKEND"] = backend
        return backend

    @app.get("/health")
    def health():
        backend = get_inference_backend()["backend"]
        return jsonify({"status": "ok", "service": "inference", "backend": backend}), 200

    @app.post("/predict")
    def predict():
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        uploaded_file = request.files["file"]
        if uploaded_file.filename == "":
            return jsonify({"error": "No file provided"}), 400

        suffix = Path(uploaded_file.filename).suffix or ".img"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
            temp_path = temp_file.name
            uploaded_file.save(temp_path)

        try:
            inference_backend = get_inference_backend()

            if inference_backend["backend"] == "keras_score":
                result = predict_score(inference_backend, temp_path)
                if result is None:
                    return jsonify({"error": "Invalid image"}), 400

                prediction, confidence, predicted_score = result
                return jsonify(
                    {
                        "prediction": prediction,
                        "confidence": round(float(confidence), 2),
                        "predictedScore": predicted_score,
                        "backend": inference_backend["backend"],
                    }
                )

            features = extract_features(temp_path)
            if features is None:
                return jsonify({"error": "Invalid image"}), 400

            model = inference_backend["model"]
            proba = model.predict_proba([features])[0]
            confidence = max(proba)
            prediction = model.predict([features])[0]
            return jsonify(
                {
                    "prediction": str(prediction),
                    "confidence": round(float(confidence) * 100, 2),
                    "backend": inference_backend["backend"],
                }
            )
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)
