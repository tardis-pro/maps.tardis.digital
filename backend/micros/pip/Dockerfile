# Use the official Rust image as the base image
FROM rust:latest as build

WORKDIR /app

# Copy your Rust project to the container
COPY . .

# Build the application
RUN cargo build --release

# The final base image, which will only contain the binary
FROM debian:buster-slim

# Copy the binary from the build container
COPY --from=build /app/target/release/pip /usr/local/bin/pip

# Set the binary as the entrypoint
ENTRYPOINT ["pip"]
