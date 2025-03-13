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

ARG VITE_BACKEND_API_URL
ENV VITE_BACKEND_API_URL=$VITE_BACKEND_API_URL

ARG VITE_API_KEY
ENV VITE_API_KEY=$VITE_API_KEY

COPY --from=builder /app .
EXPOSE 4173
CMD ["npm", "run", "previewhost"]