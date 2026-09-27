FROM python:3.11-slim

WORKDIR /app

COPY pentaia/iris/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY pentaia/iris/ .

EXPOSE 8003

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]