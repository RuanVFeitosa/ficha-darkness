FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4000 \
    SERVE_FRONTEND=false \
    DATA_DIR=/data

# Keep the root lockfile so backend dependencies are reproducible.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --workspace backend --omit=dev --ignore-scripts && npm cache clean --force

COPY backend ./backend
RUN mkdir -p /data

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "backend/server.js"]
