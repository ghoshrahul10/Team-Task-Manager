FROM node:22-slim AS frontend

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build


FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBUG=False

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend/ /app/backend/
COPY --from=frontend /app/frontend/dist /app/frontend/dist

WORKDIR /app/backend
RUN python manage.py collectstatic --noinput

CMD python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}
