FROM rust:1.75-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install wasm-pack
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Copy source code
COPY Cargo.toml Cargo.lock ./
COPY src/ ./src/
COPY www/ ./www/

# Build the project
RUN chmod +x build.sh
RUN ./build.sh production

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/www /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Add security headers
RUN echo 'add_header Cross-Origin-Embedder-Policy require-corp;' > /etc/nginx/conf.d/headers.conf && \
    echo 'add_header Cross-Origin-Opener-Policy same-origin;' >> /etc/nginx/conf.d/headers.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
