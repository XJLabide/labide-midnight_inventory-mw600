import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = resolve(root, "data");
mkdirSync(dataDirectory, { recursive: true });
const database = new DatabaseSync(resolve(dataDirectory, "inventory.sqlite"));
const port = Number(process.env.API_PORT ?? 3002);
const columns = "id, name, category, description, price, stock_quantity AS stockQuantity, supplier, status, created_at AS createdAt, updated_at AS updatedAt";

database.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
    supplier TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Inactive', 'Discontinued')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const count = database.prepare("SELECT COUNT(*) AS count FROM products").get().count;
if (count === 0) {
  const seed = [
    ["Arc Desk Lamp", "Workspace", "Adjustable task lamp with a brushed aluminum arm.", 129, 24, "Northline Supply", "Active", "2026-01-12T09:00:00.000Z"],
    ["Field Notebook Set", "Stationery", "Three durable dot-grid notebooks for daily notes and planning.", 18.5, 8, "Paper & Co.", "Active", "2026-01-18T09:00:00.000Z"],
    ["Meridian Cable Tray", "Workspace", "Under-desk cable management tray with a matte steel finish.", 42, 12, "Northline Supply", "Active", "2026-02-03T09:00:00.000Z"],
    ["Harbor USB Hub", "Accessories", "Compact seven-port USB-C hub with pass-through charging.", 64, 5, "Signal Works", "Inactive", "2026-02-20T09:00:00.000Z"],
  ];
  const insert = database.prepare("INSERT INTO products (name, category, description, price, stock_quantity, supplier, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  database.exec("BEGIN IMMEDIATE");
  try {
    seed.forEach((item) => insert.run(...item, item[7]));
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function send(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  let raw = "";
  for await (const chunk of request) raw += chunk;
  if (raw.length > 1_000_000) throw new Error("Request body is too large");
  return JSON.parse(raw || "{}");
}

function validateProduct(value) {
  const statuses = ["Active", "Inactive", "Discontinued"];
  if (!value || typeof value !== "object" || typeof value.name !== "string" || !value.name.trim() || typeof value.category !== "string" || !value.category.trim() || typeof value.description !== "string" || typeof value.supplier !== "string" || !value.supplier.trim() || !Number.isFinite(value.price) || value.price < 0 || !Number.isInteger(value.stockQuantity) || value.stockQuantity < 0 || !statuses.includes(value.status)) {
    throw new Error("Product fields are invalid");
  }
}

createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS", "access-control-allow-headers": "content-type" });
    return response.end();
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const match = url.pathname.match(/^\/api\/products(?:\/(\d+))?$/);
  if (!match) return send(response, 404, { error: "Route not found" });

  try {
    const id = match[1] ? Number(match[1]) : null;
    if (request.method === "GET" && id === null) {
      const products = database.prepare(`SELECT ${columns} FROM products ORDER BY id DESC`).all();
      return send(response, 200, products);
    }
    if (request.method === "GET" && id !== null) {
      const product = database.prepare(`SELECT ${columns} FROM products WHERE id = ?`).get(id);
      return product ? send(response, 200, product) : send(response, 404, { error: "Product not found" });
    }
    if (request.method === "POST" && id === null) {
      const input = await readBody(request);
      validateProduct(input);
      const now = new Date().toISOString();
      const result = database.prepare("INSERT INTO products (name, category, description, price, stock_quantity, supplier, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(input.name.trim(), input.category.trim(), input.description, input.price, input.stockQuantity, input.supplier.trim(), input.status, now, now);
      return send(response, 201, database.prepare(`SELECT ${columns} FROM products WHERE id = ?`).get(Number(result.lastInsertRowid)));
    }
    if (request.method === "PUT" && id !== null) {
      const input = await readBody(request);
      validateProduct(input);
      const result = database.prepare("UPDATE products SET name = ?, category = ?, description = ?, price = ?, stock_quantity = ?, supplier = ?, status = ?, updated_at = ? WHERE id = ?")
        .run(input.name.trim(), input.category.trim(), input.description, input.price, input.stockQuantity, input.supplier.trim(), input.status, new Date().toISOString(), id);
      if (result.changes === 0) return send(response, 404, { error: "Product not found" });
      return send(response, 200, database.prepare(`SELECT ${columns} FROM products WHERE id = ?`).get(id));
    }
    if (request.method === "DELETE" && id !== null) {
      const result = database.prepare("DELETE FROM products WHERE id = ?").run(id);
      return result.changes ? send(response, 200, { success: true }) : send(response, 404, { error: "Product not found" });
    }
    return send(response, 405, { error: "Method not allowed" });
  } catch (error) {
    const status = error instanceof SyntaxError || error instanceof Error && error.message === "Product fields are invalid" ? 400 : 500;
    return send(response, status, { error: error instanceof Error ? error.message : "Unexpected server error" });
  }
}).listen(port, "0.0.0.0", () => console.log(`Inventory API listening on http://localhost:${port}`));
