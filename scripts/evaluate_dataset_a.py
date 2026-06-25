import argparse
import csv
import json
import mimetypes
import urllib.error
import urllib.request
import uuid
from pathlib import Path

SCORES = list(range(1, 10))


def accuracy_score(y_true, y_pred):
    return sum(actual == predicted for actual, predicted in zip(y_true, y_pred)) / len(y_true)


def build_confusion_matrix(y_true, y_pred, labels):
    label_to_index = {label: index for index, label in enumerate(labels)}
    matrix = [[0 for _ in labels] for _ in labels]

    for actual, predicted in zip(y_true, y_pred):
        if actual in label_to_index and predicted in label_to_index:
            matrix[label_to_index[actual]][label_to_index[predicted]] += 1

    return matrix


def build_classification_report(y_true, y_pred, labels):
    report = {}
    macro_precision = 0.0
    macro_recall = 0.0
    macro_f1 = 0.0

    for label in labels:
        true_positive = sum(actual == label and predicted == label for actual, predicted in zip(y_true, y_pred))
        false_positive = sum(actual != label and predicted == label for actual, predicted in zip(y_true, y_pred))
        false_negative = sum(actual == label and predicted != label for actual, predicted in zip(y_true, y_pred))
        support = sum(actual == label for actual in y_true)

        precision = true_positive / (true_positive + false_positive) if true_positive + false_positive else 0.0
        recall = true_positive / (true_positive + false_negative) if true_positive + false_negative else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0

        report[str(label)] = {
            "precision": precision,
            "recall": recall,
            "f1-score": f1,
            "support": support,
        }

        macro_precision += precision
        macro_recall += recall
        macro_f1 += f1

    label_count = len(labels)
    report["macro avg"] = {
        "precision": macro_precision / label_count,
        "recall": macro_recall / label_count,
        "f1-score": macro_f1 / label_count,
        "support": len(y_true),
    }
    return report


def post_image(api_url, image_path):
    boundary = f"----fawcheck-{uuid.uuid4().hex}"
    mime_type = mimetypes.guess_type(image_path.name)[0] or "application/octet-stream"
    image_bytes = image_path.read_bytes()
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{image_path.name}"\r\n'
        f"Content-Type: {mime_type}\r\n\r\n"
    ).encode("utf-8") + image_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    request = urllib.request.Request(
        api_url.rstrip("/") + "/predict",
        data=body,
        method="POST",
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{image_path} failed with HTTP {error.code}: {detail}") from error


def read_rows(csv_path):
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def require_columns(rows, columns):
    if not rows:
        raise ValueError("Dataset A CSV is empty.")

    missing = [column for column in columns if column not in rows[0]]
    if missing:
        raise ValueError(f"Dataset A CSV is missing columns: {', '.join(missing)}")


def resolve_path(csv_path, image_path):
    path = Path(image_path)
    if path.is_absolute():
        return path
    return (csv_path.parent / path).resolve()


def write_results(output_path, rows):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "image_id",
        "image_path",
        "true_score",
        "predicted_score",
        "prediction_label",
        "confidence",
        "abs_error",
        "within_plus_minus_1",
    ]
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_metrics(output_path, y_true, y_pred):
    report = build_classification_report(y_true, y_pred, SCORES)
    matrix = build_confusion_matrix(y_true, y_pred, SCORES)
    abs_errors = [abs(predicted - actual) for actual, predicted in zip(y_true, y_pred)]
    payload = {
        "accuracy": accuracy_score(y_true, y_pred),
        "macro_precision": report["macro avg"]["precision"],
        "macro_recall": report["macro avg"]["recall"],
        "macro_f1": report["macro avg"]["f1-score"],
        "off_by_one_accuracy": sum(error <= 1 for error in abs_errors) / len(abs_errors),
        "mae": sum(abs_errors) / len(abs_errors),
        "labels": SCORES,
        "confusion_matrix": matrix,
        "classification_report": report,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


def main():
    parser = argparse.ArgumentParser(description="Evaluate Dataset A against the FAWCheck inference API.")
    parser.add_argument("dataset_csv", type=Path, help="CSV with image_id,image_path,true_score columns.")
    parser.add_argument("--api-url", default="http://localhost:5000", help="Inference API base URL.")
    parser.add_argument("--output", type=Path, default=Path("evaluation-results/dataset-a-results.csv"))
    parser.add_argument("--metrics", type=Path, default=Path("evaluation-results/dataset-a-metrics.json"))
    args = parser.parse_args()

    rows = read_rows(args.dataset_csv)
    require_columns(rows, ["image_id", "image_path", "true_score"])

    result_rows = []
    y_true = []
    y_pred = []

    for index, row in enumerate(rows, start=1):
        image_path = resolve_path(args.dataset_csv, row["image_path"])
        if not image_path.exists():
            raise FileNotFoundError(f"Image not found for row {index}: {image_path}")

        true_score = int(row["true_score"])
        payload = post_image(args.api_url, image_path)
        predicted_score = int(payload.get("predictedScore") or str(payload.get("prediction", "")).split("_")[-1])
        confidence = float(payload.get("confidence", 0))
        abs_error = abs(predicted_score - true_score)

        result_rows.append(
            {
                "image_id": row["image_id"],
                "image_path": str(image_path),
                "true_score": true_score,
                "predicted_score": predicted_score,
                "prediction_label": payload.get("prediction", ""),
                "confidence": confidence,
                "abs_error": abs_error,
                "within_plus_minus_1": abs_error <= 1,
            }
        )
        y_true.append(true_score)
        y_pred.append(predicted_score)
        print(f"[{index}/{len(rows)}] {row['image_id']}: true={true_score}, predicted={predicted_score}")

    write_results(args.output, result_rows)
    metrics = write_metrics(args.metrics, y_true, y_pred)

    print("\nDataset A complete")
    print(f"Results: {args.output}")
    print(f"Metrics: {args.metrics}")
    print(f"Accuracy: {metrics['accuracy']:.4f}")
    print(f"Macro F1: {metrics['macro_f1']:.4f}")
    print(f"Off-by-one accuracy: {metrics['off_by_one_accuracy']:.4f}")
    print(f"MAE: {metrics['mae']:.4f}")


if __name__ == "__main__":
    main()
