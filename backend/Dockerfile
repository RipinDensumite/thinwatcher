FROM node:18-alpine as builder

# Build frontend
WORKDIR /app
COPY app/package*.json ./
RUN npm install
COPY app/ .
RUN npm run build

# Setup backend
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ .
# Copy built frontend
COPY --from=builder /app/dist ./dist

EXPOSE 80
CMD ["node", "index.js"]