# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies only - pin exact versions for reproducibility
# Using the same versions as runtime to ensure ABI compatibility
RUN apt-get update && apt-get install -y \
    build-essential \
    libgdal-dev \
    libgeos-dev \
    libproj-dev=9.6.0-1 \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

# Runtime stage
FROM python:3.11-slim as runtime

WORKDIR /app

# Install only runtime dependencies - pin exact versions matching build stage
# These versions must match what was used during compilation for ABI compatibility
RUN apt-get update && apt-get install -y \
    libgdal33t64 \
    libgeos3.11.1t64 \
    libproj22t64 \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Create non-root user
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
