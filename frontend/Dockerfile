# Multi-stage Dockerfile for EXAMIND React/Vite Frontend
# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm support
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application source
COPY . .

# Build production bundle
RUN pnpm run build

# Stage 2: Serve with Production Nginx
FROM nginx:alpine

# Remove default nginx assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

