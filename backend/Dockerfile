FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=Production
COPY . .
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "index.js"]