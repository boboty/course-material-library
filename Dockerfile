FROM node:24-slim AS web-build
WORKDIR /build
COPY web/package*.json ./web/
RUN cd web && npm ci
COPY web ./web
COPY ui/design-system ./ui/design-system
RUN cd web && npm run build

FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml ./
COPY app ./app
COPY alembic.ini ./
COPY alembic ./alembic
RUN pip install --no-cache-dir .
COPY --from=web-build /build/web/dist ./web/dist
ENV APP_ENV=production LOG_JSON=true
EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && echo 'Alembic migration completed' && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --no-access-log"]
