# d7-design-product

Standalone extracted design product from D7-ANAL.

## Current MVP scope

- Creatives — interactive MVP
- Visuals — interactive MVP
- Model Database — list/detail/create-edit shell
- Design Team ops-light — read-only shell

## Run

### 1. Install

```bash
cd d7-design-product
npm --prefix client install
npm --prefix server install
```

### 2. Start backend

```bash
cd d7-design-product
npm --prefix server run dev
```

Backend runs on:
- `http://localhost:8080`

### 3. Start frontend

```bash
cd d7-design-product
npm --prefix client run dev
```

Frontend runs on:
- `http://localhost:5174`

Vite proxy forwards `/api/*` to backend.
Use env when deployed:
- `VITE_API_TARGET=https://your-server-domain`

## Validation

```bash
cd d7-design-product
npm --prefix client run build
npm --prefix server run check
```

## Database

Server supports Railway Postgres wiring.

Required server env for DB init / later persistence:
- `DATABASE_URL`

Initialize schema:

```bash
cd server
npm run db:init
```

Current status:
- DB schema prepared
- runtime still uses mock/in-memory data until persistence layer is wired

## Current structure

```text
client/
server/
shared/
notes/
```

## Notes

- Current backend is mock/in-memory based for runtime behavior.
- Current goal is extraction speed and runnable MVP shell.
- Next steps: connect runtime routes to Postgres, replace mocks, add auth/session and real persistence.
