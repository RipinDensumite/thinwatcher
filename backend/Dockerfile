# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application (if needed)
RUN npm run build

# Production stage
FROM node:20-alpine

# Add labels
LABEL maintainer="ThinWatcher"
LABEL description="ThinWatcher Backend Service"
LABEL version="1.0"

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /usr/src/app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /usr/src/app/server.js ./
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/dist ./dist

# Create data directory and set permissions
RUN mkdir -p ./data && chown -R appuser:appgroup ./data

# Set volume for persistent data
VOLUME /usr/src/app/data

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 80

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Start the application
CMD ["node", "server.js"]