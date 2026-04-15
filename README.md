# Symbols Backend

NestJS backend for managing users, symbols, auth, sockets, and Binance market data streams.

## Overview

- Cookie-based authentication with `accessToken` and `refreshToken`
- Roles for `ADMIN` and `CLIENT`
- Admin CRUD for users and symbols
- Client symbol list and live ticker subscriptions over Socket.IO
- Binance market data bridge with a single stable combined mini-ticker stream
- Static Vue frontend in `/public/index.html`
- Swagger UI available at the app root

## Tech Stack

- NestJS with Fastify
- MongoDB with Mongoose
- Socket.IO
- Swagger
- Binance Spot WebSocket Streams via `@binance/spot`
- Vue front-end

## Prerequisites

- Node.js 22.x
- npm 10.x or newer
- Docker and Docker Compose

## 🐳 Docker (Full start)

The repository contains a Docker setup for the API and MongoDB.

Setup .secrets folder, or just copy from .secrets.example:

```bash
mkdir -p .secrets && cp -r .secrets.example/* .secrets/
```

Build and start everything:

```bash
docker compose up --build
```

Run seeds inside Docker after the stack is up:

```bash
docker compose run --rm api npm run seed:all:prod
```

Or run them against a running container:

```bash
docker compose exec api npm run seed:all:prod
```

Required Docker secrets are mounted from `.secrets/`:

- `mongodb-uri`
- `jwt-secret-access-token`
- `jwt-secret-refresh-token`
- `swagger-username`
- `swagger-password`

## 🚀 Local Run

Install dependencies:

```bash
npm install
```

Setup .secrets folder, or just copy from .secrets.example

```bash
npm run seed:secrets
```

For a local database, you can start only MongoDB with Docker:

```bash
docker compose up mongodb -d
```

Start the app locally after MongoDB is available:

```bash
npm run start:dev
```

Useful URLs:

- Swagger UI: `http://localhost:8080/`
- Static frontend: `http://localhost:8080/public/index.html`

Default demo credentials:

- `admin@gmail.com` / `Password1`
- `client@gmail.com` / `Password1`

## Seeds

Available seed commands:

```bash
npm run seed:admin
npm run seed:client
npm run seed:symbols
npm run seed:all
```

What they do:

- `seed:admin` creates the default admin user
- `seed:client` creates the default client user
- `seed:symbols` creates 50 popular Binance symbols
- `seed:all` runs all seeds in sequence

## Environment

The app reads environment-specific files such as:

- `.env.development`
- `.env.production`

Important Binance-related options:

- `BINANCE_WS_URL`
- `BINANCE_WS_RECONNECT_DELAY`
- `BINANCE_WS_MODE`
- `BINANCE_WS_POOL_SIZE`

## What Is Served

- `GET /` - Swagger UI
- `GET /public/index.html` - simple Vue frontend
- `GET /api/v1/...` - REST API routes
- Socket.IO endpoint is used by the frontend for live symbol updates
