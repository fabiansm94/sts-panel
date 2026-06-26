FROM node:20-alpine
WORKDIR /app
COPY panel-clientes.html .
COPY server.js .
COPY api/ ./api/
EXPOSE 3000
CMD ["node", "server.js"]
