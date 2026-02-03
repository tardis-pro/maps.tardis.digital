# Build stage - Pin Rust version
FROM rust:1.75-slim as builder

WORKDIR /app

# Copy Cargo files first for better caching
COPY Cargo.toml Cargo.lock ./

# Create dummy main.rs to build dependencies
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy actual source code
COPY src ./src/

# Build the application
RUN cargo build --release

# Runtime stage - Use Alpine for smaller size
FROM alpine:3.18

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    libgcc

# Copy the binary from builder stage
COPY --from=builder /app/target/release/pip /usr/local/bin/pip

# Create non-root user
RUN adduser -D -s /bin/sh pip
USER pip

ENTRYPOINT ["pip"]
