FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY server.js ./
COPY dist/ ./dist/

RUN mkdir -p ./data

VOLUME /usr/src/app/data

EXPOSE 80

CMD ["node", "server.js"]