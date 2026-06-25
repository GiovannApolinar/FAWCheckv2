import argparse
import base64
import csv
import json
import mimetypes
import os
import urllib.error
import urllib.request
import uuid
from pathlib import Path

SCORES = list(range(1, 10))


def weighted_cohens_kappa(expert_scores, final_scores, labels):
    if len(expert_scores) != len(final_scores):
        raise ValueError("Score lists must have the same length.")
    if not expert_scores:
        raise ValueError("At least one scored case is required.")

    label_to_index = {label: index for index, label in enumerate(labels)}
    size = len(labels)
    observed = [[0.0 for _ in labels] for _ in labels]
    expert_hist = [0.0 for _ in labels]
    final_hist = [0.0 for _ in labels]

    for expert, final in zip(expert_scores, final_scores):
        if expert not in label_to_index or final not in label_to_index:
            raise ValueError("Scores must be between 1 and 9 for weighted kappa.")

        expert_index = label_to_index[expert]
        final_index = label_to_index[final]
        observed[expert_index][final_index] += 1.0
        expert_hist[expert_index] += 1.0
        final_hist[final_index] += 1.0

    total = float(len(expert_scores))
    weighted_observed = 0.0
    weighted_expected = 0.0

    for i in range(size):
        for j in range(size):
            weight = ((i - j) ** 2) / ((size - 1) ** 2)
            expected = expert_hist[i] * final_hist[j] / total
            weighted_observed += weight * observed[i][j]
            weighted_expected += weight * expected

    if weighted_expected == 0:
        return 1.0 if weighted_observed == 0 else 0.0

    return 1.0 - (weighted_observed / weighted_expected)


def read_rows(csv_path):
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def require_columns(rows, columns):
    if not rows:
        raise ValueError("Dataset B CSV is empty.")

    missing = [column for column in columns if column not in rows[0]]
    if missing:
        raise ValueError(f"Dataset B CSV is missing columns: {', '.join(missing)}")


def request_json(url, method="GET", payload=None, token=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{url} failed with HTTP {error.code}: {detail}") from error


def login(api_url, email, password):
    payload = request_json(
        api_url.rstrip("/") + "/api/auth/login",
        method="POST",
        payload={"email": email, "password": password},
    )
    token = payload.get("token")
    if not token:
        raise RuntimeError("Login succeeded but no token was returned.")
    return token


def resolve_path(csv_path, image_path):
    path = Path(image_path)
    if path.is_absolute():
        return path
    return (csv_path.parent / path).resolve()


def parse_bool(value):
    return str(value).strip().lower() in {"1", "true", "yes", "y"}


def parse_optional_int(value):
    value = str(value or "").strip()
    return None if value == "" else int(value)


def image_data_url(image_path):
    mime_type = mimetypes.guess_type(image_path.name)[0] or "application/octet-stream"
    encoded = base64.b64encode(image_path.read_bytes()).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def build_payload(csv_path, row):
    image_path = resolve_path(csv_path, row["image_path"])
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    return {
        "clientGeneratedId": row.get("case_id") or uuid.uuid4().hex,
        "dap": int(row.get("dap") or 0),
        "locationText": row.get("location_text") or row.get("location") or "Dataset B evaluation",
        "imageName": image_path.name,
        "imageBase64": image_data_url(image_path),
        "symptoms": {
            "leafFeedingDamage": parse_bool(row["leaf_feeding_damage"]),
            "olderLeavesWithPinholeCount": int(row["older_leaves_with_pinhole_count"]),
            "shotHoleLeafBand": row["shot_hole_leaf_band"],
            "elongatedLesionBand": row["elongated_lesion_band"],
            "holeBand": row["hole_band"],
            "whorlFurlDestruction": row["whorl_furl_destruction"],
            "plantDying": parse_bool(row["plant_dying"]),
            "larvaeCount": parse_optional_int(row.get("larvae_count")),
        },
    }


def write_results(output_path, rows):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "case_id",
        "expert_score",
        "rule_score",
        "final_score",
        "abs_error_vs_expert",
        "response_band",
        "final_confidence",
        "final_confidence_percent",
        "image_prediction_label",
        "image_prediction_confidence",
        "flags",
    ]
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_metrics(output_path, expert_scores, final_scores):
    abs_errors = [abs(final - expert) for expert, final in zip(expert_scores, final_scores)]
    payload = {
        "mae": sum(abs_errors) / len(abs_errors),
        "weighted_cohens_kappa": weighted_cohens_kappa(expert_scores, final_scores, SCORES),
        "case_count": len(expert_scores),
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


def main():
    parser = argparse.ArgumentParser(description="Evaluate Dataset B against the FAWCheck backend API.")
    parser.add_argument("dataset_csv", type=Path, help="CSV with expert scores and symptom inputs.")
    parser.add_argument("--api-url", default="http://localhost:5268", help="Backend API base URL.")
    parser.add_argument("--email", default=os.environ.get("FAWCHECK_EMAIL"), help="Approved user/admin email.")
    parser.add_argument("--password", default=os.environ.get("FAWCHECK_PASSWORD"), help="Approved user/admin password.")
    parser.add_argument("--token", default=os.environ.get("FAWCHECK_TOKEN"), help="Existing bearer token.")
    parser.add_argument("--output", type=Path, default=Path("evaluation-results/dataset-b-results.csv"))
    parser.add_argument("--metrics", type=Path, default=Path("evaluation-results/dataset-b-metrics.json"))
    args = parser.parse_args()

    token = args.token
    if not token:
        if not args.email or not args.password:
            raise RuntimeError("Provide --token, or provide --email and --password for an approved account.")
        token = login(args.api_url, args.email, args.password)

    rows = read_rows(args.dataset_csv)
    require_columns(
        rows,
        [
            "case_id",
            "image_path",
            "expert_score",
            "leaf_feeding_damage",
            "older_leaves_with_pinhole_count",
            "shot_hole_leaf_band",
            "elongated_lesion_band",
            "hole_band",
            "whorl_furl_destruction",
            "plant_dying",
        ],
    )

    result_rows = []
    expert_scores = []
    final_scores = []

    for index, row in enumerate(rows, start=1):
        payload = build_payload(args.dataset_csv, row)
        response = request_json(
            args.api_url.rstrip() + "/api/assessment/evaluate",
            method="POST",
            payload=payload,
            token=token,
        )
        expert_score = int(row["expert_score"])
        final_score = int(response["finalScore"])
        image_prediction = response.get("imagePrediction") or {}

        result_rows.append(
            {
                "case_id": row["case_id"],
                "expert_score": expert_score,
                "rule_score": response["ruleScore"],
                "final_score": final_score,
                "abs_error_vs_expert": abs(final_score - expert_score),
                "response_band": response["responseBand"],
                "final_confidence": response["finalConfidence"],
                "final_confidence_percent": response["finalConfidencePercent"],
                "image_prediction_label": image_prediction.get("label", ""),
                "image_prediction_confidence": image_prediction.get("confidence", ""),
                "flags": "|".join(response.get("flags", [])),
            }
        )
        expert_scores.append(expert_score)
        final_scores.append(final_score)
        print(f"[{index}/{len(rows)}] {row['case_id']}: expert={expert_score}, final={final_score}")

    write_results(args.output, result_rows)
    metrics = write_metrics(args.metrics, expert_scores, final_scores)

    print("\nDataset B complete")
    print(f"Results: {args.output}")
    print(f"Metrics: {args.metrics}")
    print(f"MAE: {metrics['mae']:.4f}")
    print(f"Weighted Cohen's kappa: {metrics['weighted_cohens_kappa']:.4f}")


if __name__ == "__main__":
    main()
