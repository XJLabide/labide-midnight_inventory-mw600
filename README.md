# Midnight Inventory

Inventory information system built with React, TypeScript, Vite, Tailwind CSS v4, and a local SQLite API server.

Project design and implementation rules are documented in [GUIDELINES.md](./GUIDELINES.md). Update that file when a new requirement is confirmed.

## Run locally

Requires Node.js 24 LTS or newer (for the built-in `node:sqlite` module).

```bash
npm install
npm run dev
```

This starts the Vite app and the API server together. Vite serves the app on port 3001 and forwards `/api` requests to the server on port 3002. Set `API_PORT` to change the server port.

Build and preview the client:

```bash
npm run build
npm run preview
```

Run the type checks and browser-data-layer tests with:

```bash
npm test
```

## API approach

Product CRUD operations are exposed through the asynchronous API module at `client/src/lib/api.ts`. It calls the local HTTP server, which stores products in `data/inventory.sqlite` using SQLite. Product retrieval is available through `GET /api/products` and `GET /api/products/:id`; create, update, and delete use the corresponding `POST`, `PUT`, and `DELETE` routes.

Reorder requests and recent activity still use browser `localStorage`.

## Pages

- Dashboard
- Products
- Product Details
- Inventory Reports

Product data can be reset by stopping the server and removing `data/inventory.sqlite`; the server recreates the database and sample products on the next start. Reorder requests and recent activity can be reset by clearing site local storage.
