FROM python:3.12-alpine3.23

# Install system dependencies (pandoc for markdown-to-docx conversion)
RUN apk add --no-cache pandoc

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY document_converter.py main.py ./
COPY static/ static/

# Create working directories
RUN mkdir -p uploads outputs

EXPOSE 8678

CMD ["uvicorn", "main:socket_app", "--host", "0.0.0.0", "--port", "8678"]
