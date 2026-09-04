FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY docs .

# Modell von Hugging Face herunterladen beim Start
ENV MODEL_PATH=/app/model/finetuned-model

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]