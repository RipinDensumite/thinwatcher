FROM node:18-alpine

# Setup backend
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Create data directory if it doesn't exist
RUN mkdir -p data

# Expose the port defined in .env (default is 80)
EXPOSE 80

CMD ["node", "index.js"]