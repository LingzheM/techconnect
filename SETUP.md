# Setup Guide

## Prerequisites

- Node.js >= 20
- Docker & Docker Compose (for PostgreSQL)
- npm

---

## Local Development

### 1. Clone & install

```bash
git clone <repo-url>
cd techconnect
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

This starts two containers:
- `db` on port **5432** — development database (`techconnect`)
- `db-test` on port **5433** — test database (`techconnect_test`)

### 3. Configure backend

```bash
cd backend
cp .env.example .env        # then fill in values (see below)
```

### 4. Run migrations & seed

```bash
npx prisma migrate deploy   # apply all migrations
npm run seed                 # seed dev data (alice/bob/charlie/diana, pw: password123)
```

### 5. Start backend

```bash
npm run dev                  # tsx watch, hot-reload on :3000
```

### 6. Configure frontend

```bash
cd ../frontend
cp .env.example .env         # optional — defaults work for local dev
```

### 7. Start frontend

```bash
npm run dev                  # Vite on :5173
```

Open http://localhost:5173.

---

## Environment Variables

### `backend/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string, e.g. `postgresql://techconnect:techconnect@localhost:5432/techconnect` |
| `JWT_SECRET` | ✅ | — | Secret key for signing JWTs. Use a long random string in production. |
| `CORS_ORIGIN` | — | `http://localhost:5173` | Allowed frontend origin |

### `backend/.env.test`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Point to the test DB: `postgresql://techconnect:techconnect@localhost:5433/techconnect_test` |

### `frontend/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | — | `http://localhost:3000` | Backend API base URL |

---

## Running Tests

```bash
# Backend (requires db-test container running)
cd backend && npm test

# Frontend
cd frontend && npm test
```

---

## Common Errors

**`Error: connect ECONNREFUSED 127.0.0.1:5432`**
→ Database container isn't running. Run `docker compose up -d` and retry.

**`Error: @prisma/client did not initialize yet`**
→ Run `npx prisma generate` inside `backend/`.

**`PrismaClientKnownRequestError: Migration table not found`**
→ Run `npx prisma migrate deploy` to apply pending migrations.

**`JsonWebTokenError: secret or public key must be provided`**
→ `JWT_SECRET` is missing from your `.env`. Add it and restart the server.

**Frontend shows blank feed after login**
→ Check that the backend is running on the URL configured in `VITE_API_URL` (default: `http://localhost:3000`). Verify with `curl http://localhost:3000/health`.
