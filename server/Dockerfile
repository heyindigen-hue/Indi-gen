FROM node:20-alpine AS builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
COPY db /app/db

FROM node:20-alpine
WORKDIR /app/server
RUN apk add --no-cache wget tini
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/src ./src
COPY --from=builder /app/db /app/db
COPY server/package*.json server/tsconfig.json ./
EXPOSE 3001
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npx", "tsx", "src/index.ts"]
