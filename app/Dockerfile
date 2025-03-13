# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Define ARGs before build
ARG VITE_BACKEND_API_URL
ENV VITE_BACKEND_API_URL=$VITE_BACKEND_API_URL
ARG VITE_API_KEY
ENV VITE_API_KEY=$VITE_API_KEY

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

EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]