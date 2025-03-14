# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json

# Install only production dependencies
RUN npm install -g serve

# Set environment variables
ENV VITE_BACKEND_API_URL=${VITE_BACKEND_API_URL:-default-url}
ENV VITE_API_KEY=${VITE_API_KEY:-default-key}

# Create a script to replace placeholders if needed
COPY replace-env.js /app/replace-env.js
RUN ndoe /app/replace-env.js

EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]