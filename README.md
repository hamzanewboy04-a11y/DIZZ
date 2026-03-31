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
- `http://localhost:4010`

### 3. Start frontend

```bash
cd d7-design-product
npm --prefix client run dev
```

Frontend runs on:
- `http://localhost:5174`

Vite proxy forwards `/api/*` to backend `:4010`.

## Validation

```bash
cd d7-design-product
npm --prefix client run build
npm --prefix server run check
```

## Current structure

```text
client/
server/
shared/
notes/
```

## Notes

- Current backend is mock/in-memory based.
- Current goal is extraction speed and runnable MVP shell.
- Next steps: modularize App.tsx, replace in-memory data, add auth/session and real persistence.
