# ==========================================
# Stage 1: Build React + Vite Client
# ==========================================
FROM node:20-alpine AS client-build
WORKDIR /app

# Copy root manifests and workspace configs
COPY package*.json ./
COPY packages/client/package.json packages/client/
COPY packages/server/package.json packages/server/

# Install client dependencies
RUN npm install --workspace=packages/client

# Copy client source and build
COPY packages/client packages/client
RUN npm run build --workspace=packages/client

# ==========================================
# Stage 2: Build Express Backend Server
# ==========================================
FROM node:20-alpine AS server-build
WORKDIR /app

COPY package*.json ./
COPY packages/client/package.json packages/client/
COPY packages/server/package.json packages/server/

# Install server dependencies
RUN npm install --workspace=packages/server

# Copy server source and compile TypeScript
COPY packages/server packages/server
RUN npm run build --workspace=packages/server

# ==========================================
# Stage 3: Production Runtime
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy root manifest & server dependencies
COPY package*.json ./
COPY packages/server/package.json packages/server/
RUN npm install --omit=dev --workspace=packages/server

# Copy built server from server-build
COPY --from=server-build /app/packages/server/dist ./packages/server/dist

# Copy built client into server/public for static SPA serving
COPY --from=client-build /app/packages/client/dist ./packages/server/public

WORKDIR /app/packages/server
EXPOSE 5000

CMD ["node", "dist/index.js"]
