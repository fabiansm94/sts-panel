FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --production 2>/dev/null || true
COPY . .
EXPOSE 3000
HEALTHCHECK NONE
CMD ["node", "server.js"]