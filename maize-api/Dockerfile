FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=5000
ENV FAWCHECK_MODEL_PATH=/app/models/fawcheck_finetuned.keras

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY maize-api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY maize-api/app.py ./app.py
COPY maize-api/models/fawcheck_finetuned.keras ./models/fawcheck_finetuned.keras
COPY maize-api/models/label_map.json ./models/label_map.json

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--timeout", "120", "app:app"]
