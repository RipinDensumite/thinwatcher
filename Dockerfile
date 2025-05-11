# Build stage for React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
# Copy frontend package files
COPY app/package*.json ./
RUN npm install
# Copy frontend source
COPY app/ ./
# Build frontend
RUN npm run build

# Backend stage
FROM node:20-alpine
WORKDIR /app
# Copy backend files
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production
COPY backend/ ./backend/

# Copy the built frontend from build stage
COPY --from=frontend-build /app/frontend/dist ./app/dist

# Set working directory to backend for startup
WORKDIR /app/backend
CMD ["node", "server.js"]