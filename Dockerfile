### Base
FROM node:22-bookworm-slim as base
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir /app && chown -R node:node /app

USER node
WORKDIR /app

# Copy base dependencies describing
COPY --chown=node:node ./src ./src
COPY --chown=node:node ./nest-cli.json ./
COPY --chown=node:node ./package*.json ./
COPY --chown=node:node ./tsconfig*.json ./

RUN npm install --only=production


### Builder
FROM base as builder

RUN npm install --production=false
RUN npm run build


### Runtime
FROM node:22-bookworm-slim as runtime
ENV NODE_ENV=production
WORKDIR /app

# Copy runtime dependencies
COPY --chown=node:node --from=base /app/node_modules ./node_modules
COPY --chown=node:node .env.${NODE_ENV} ./
COPY --chown=node:node --from=base /app/package.json ./
COPY --chown=node:node --from=builder /app/dist ./dist

CMD ["npm", "run", "start:prod"]
