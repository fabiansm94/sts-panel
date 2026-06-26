FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY package.json .
RUN npm install --production 2>/dev/null || true
COPY . .
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 CMD curl -f http://localhost:3000/ || exit 1
CMD ["node", "server.js"]