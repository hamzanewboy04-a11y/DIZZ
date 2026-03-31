# d7-design-product

Standalone extracted design product from D7-ANAL.

## Current MVP scope

- Creatives — interactive MVP
- Visuals — interactive MVP
- Model Database — list/detail/create-edit shell
- Design Team ops-light — read-only shell

## Railway deploy

Recommended mode now: **single service**.

Use only the `server` service.
It will:
- serve API
- serve built frontend from `client/dist`

### Server service settings

**Root Directory**
```text
server
```

**Build Command**
```bash
npm install && npm run build
```

**Start Command**
```bash
npm run start
```

### Required env
- `DATABASE_URL` for Railway Postgres (optional until persistence is wired fully)

## Local run

### Backend + frontend build

```bash
cd DIZZ
npm --prefix server install
npm --prefix client install
npm --prefix server run build
npm --prefix server run start
```

App will be served from the server on:
- `http://localhost:8080`

## Validation

```bash
cd DIZZ
npm --prefix client run build
npm --prefix server run check
```

## Database

Server supports Railway Postgres wiring.

Initialize schema:

```bash
cd server
npm run db:init
```

Current status:
- DB schema prepared
- runtime still mostly mock/in-memory until persistence layer is fully wired
