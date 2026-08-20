FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

# Install python3 and yt-dlp for fallback stream resolution
RUN apk add --no-cache python3 py3-pip ffmpeg curl && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm install -g tsx

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/src ./src

ENV NODE_ENV=production
ENV PORT=3080

EXPOSE 3080

CMD ["tsx", "server/index.ts"]
