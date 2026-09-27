FROM python:3.11-slim

WORKDIR /app

COPY pentaia/mercurio/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY pentaia/mercurio/ .

EXPOSE 8004

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8004"]