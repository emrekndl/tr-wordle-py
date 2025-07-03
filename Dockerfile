FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
PYTHONUNBUFFERED=1

# FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    python3-dev \
    gcc \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*


WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY requirements.txt .
RUN uv pip install -r requirements.txt --system

ADD . /app

ENTRYPOINT []

EXPOSE 8000

CMD ["python", "main.py"]
# CMD ["uv", "run", "manage.py", "runserver", "0.0.0.0:8000"]

# podman build -t apppy.
# podman run -p 8000:8000 apppy
