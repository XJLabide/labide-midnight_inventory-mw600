import type { Product, ProductInput, ReorderRequest, ReorderRequestInput, ReorderStatus } from "@/types/product";
import { validateProductInput } from "./productValidation.js";

export type Activity = { id: string; action: "Created" | "Updated" | "Deleted"; productName: string; timestamp: string };
export type DashboardData = { totalProducts: number; totalStock: number; lowStock: number; stockValue: number; byCategory: Array<{ category: string; count: number }>; recentActivity: Activity[] };
export type InventoryReport = { lowStock: Product[]; stockValue: number; totalUnits: number; lowStockValue: number; zeroStock: Product[]; criticalItems: number; highPriorityItems: number; mediumPriorityItems: number; byCategory: Array<{ category: string; products: number; stock: number; stockValue: number; lowStock: number }>; bySupplier: Array<{ supplier: string; products: number; stock: number; stockValue: number; lowStock: number }>; reorderStatuses: Array<{ status: ReorderStatus; count: number }> };

const ACTIVITY_KEY = "midnight-inventory-activity";
const REORDER_KEY = "midnight-inventory-reorders";
const LOW_STOCK_THRESHOLD = 10;

const seedProducts: Product[] = [
  { id: 1, name: "Arc Desk Lamp", category: "Workspace", description: "Adjustable task lamp with a brushed aluminum arm.", price: 129, stockQuantity: 24, supplier: "Northline Supply", status: "Active", createdAt: "2026-01-12T09:00:00.000Z", updatedAt: "2026-01-12T09:00:00.000Z" },
  { id: 2, name: "Field Notebook Set", category: "Stationery", description: "Three durable dot-grid notebooks for daily notes and planning.", price: 18.5, stockQuantity: 8, supplier: "Paper & Co.", status: "Active", createdAt: "2026-01-18T09:00:00.000Z", updatedAt: "2026-01-18T09:00:00.000Z" },
  { id: 3, name: "Meridian Cable Tray", category: "Workspace", description: "Under-desk cable management tray with a matte steel finish.", price: 42, stockQuantity: 12, supplier: "Northline Supply", status: "Active", createdAt: "2026-02-03T09:00:00.000Z", updatedAt: "2026-02-03T09:00:00.000Z" },
  { id: 4, name: "Harbor USB Hub", category: "Accessories", description: "Compact seven-port USB-C hub with pass-through charging.", price: 64, stockQuantity: 5, supplier: "Signal Works", status: "Inactive", createdAt: "2026-02-20T09:00:00.000Z", updatedAt: "2026-02-20T09:00:00.000Z" },
];

function readReorders(): ReorderRequest[] { const saved = localStorage.getItem(REORDER_KEY); if (!saved) return []; try { const parsed: unknown = JSON.parse(saved); if (!Array.isArray(parsed)) throw new Error(); return parsed as ReorderRequest[]; } catch { throw new Error("Saved reorder data is unreadable. Clear local storage and try again."); } }
function writeReorders(requests: ReorderRequest[]) { localStorage.setItem(REORDER_KEY, JSON.stringify(requests)); }
function validateReorder(input: ReorderRequestInput) { if (!Number.isInteger(input.productId) || !input.productName.trim() || !input.supplier.trim()) throw new Error("Product and supplier are required"); if (!Number.isInteger(input.quantity) || input.quantity <= 0) throw new Error("Reorder quantity must be a positive whole number"); const statuses: ReorderStatus[] = ["Draft", "Requested", "Ordered", "Received", "Cancelled"]; if (!statuses.includes(input.status)) throw new Error("Reorder status is invalid"); }

function readActivity(): Activity[] {
  const saved = localStorage.getItem(ACTIVITY_KEY);
  if (saved) { try { const parsed: unknown = JSON.parse(saved); if (Array.isArray(parsed)) return parsed as Activity[]; } catch { /* Recreate damaged optional history. */ } }
  const initial = seedProducts.map((product) => ({ id: `initial-${product.id}`, action: "Created" as const, productName: product.name, timestamp: product.createdAt }));
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(initial));
  return initial;
}

function recordActivity(action: Activity["action"], productName: string) {
  const activity: Activity = { id: crypto.randomUUID(), action, productName, timestamp: new Date().toISOString() };
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify([activity, ...readActivity()].slice(0, 8)));
}

function getNextId(records: Array<{ id: number }>) { return records.reduce((largestId, record) => Math.max(largestId, record.id), 0) + 1; }
function calculateStockValue(products: Product[]) { return products.reduce((sum, product) => sum + product.price * product.stockQuantity, 0); }
function reorderPriority(stock: number) { return stock <= 3 ? "Critical" : stock <= 6 ? "High" : "Medium"; }
function groupProducts(products: Product[], field: "category" | "supplier") {
  return products.reduce<Record<string, { products: number; stock: number }>>((groups, product) => {
    const key = product[field];
    const group = groups[key] ?? { products: 0, stock: 0 };
    groups[key] = { products: group.products + 1, stock: group.stock + product.stockQuantity };
    return groups;
  }, {});
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const body: unknown = await response.json();
  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body ? String(body.error) : "Inventory API request failed";
    throw new Error(message);
  }
  return body as T;
}

export const api = {
  async list() { return request<Product[]>("/api/products"); },
  async get(id: number) { return request<Product>(`/api/products/${id}`); },
  async create(input: ProductInput) { validateProductInput(input); const product = await request<Product>("/api/products", { method: "POST", body: JSON.stringify(input) }); recordActivity("Created", product.name); return product; },
  async update(id: number, input: ProductInput) { validateProductInput(input); const product = await request<Product>(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(input) }); recordActivity("Updated", product.name); return product; },
  async remove(id: number) { const product = await this.get(id); await request<{ success: boolean }>(`/api/products/${id}`, { method: "DELETE" }); recordActivity("Deleted", product.name); },
  async listReorders() { return readReorders(); },
  async createReorder(input: ReorderRequestInput) { validateReorder(input); const requests = readReorders(); const now = new Date().toISOString(); const request: ReorderRequest = { ...input, id: getNextId(requests), createdAt: now, updatedAt: now }; writeReorders([request, ...requests]); return request; },
  async updateReorder(id: number, input: ReorderRequestInput) { validateReorder(input); const requests = readReorders(); if (!requests.some((request) => request.id === id)) throw new Error("Reorder request not found"); const request: ReorderRequest = { ...input, id, createdAt: requests.find((item) => item.id === id)!.createdAt, updatedAt: new Date().toISOString() }; writeReorders(requests.map((item) => item.id === id ? request : item)); return request; },
  async removeReorder(id: number) { const requests = readReorders(); if (!requests.some((request) => request.id === id)) throw new Error("Reorder request not found"); writeReorders(requests.filter((request) => request.id !== id)); },
  async dashboard(): Promise<DashboardData> { const products = await this.list(); const byCategory = Object.entries(groupProducts(products, "category")).map(([category, value]) => ({ category, count: value.products })); return { totalProducts: products.length, totalStock: products.reduce((sum, product) => sum + product.stockQuantity, 0), lowStock: products.filter((product) => product.stockQuantity <= LOW_STOCK_THRESHOLD).length, stockValue: calculateStockValue(products), byCategory, recentActivity: readActivity() }; },
  async report(): Promise<InventoryReport> { const products = await this.list(); const lowStock = products.filter((product) => product.stockQuantity <= LOW_STOCK_THRESHOLD).sort((a, b) => a.stockQuantity - b.stockQuantity); const categories = Object.entries(groupProducts(products, "category")); const suppliers = Object.entries(groupProducts(products, "supplier")); const requests = readReorders(); const statusValues: ReorderStatus[] = ["Draft", "Requested", "Ordered", "Received", "Cancelled"]; return { lowStock, stockValue: calculateStockValue(products), totalUnits: products.reduce((sum, product) => sum + product.stockQuantity, 0), lowStockValue: calculateStockValue(lowStock), zeroStock: products.filter((product) => product.stockQuantity === 0), criticalItems: lowStock.filter((product) => reorderPriority(product.stockQuantity) === "Critical").length, highPriorityItems: lowStock.filter((product) => reorderPriority(product.stockQuantity) === "High").length, mediumPriorityItems: lowStock.filter((product) => reorderPriority(product.stockQuantity) === "Medium").length, byCategory: categories.map(([category, value]) => ({ category, ...value, stockValue: products.filter((product) => product.category === category).reduce((sum, product) => sum + product.price * product.stockQuantity, 0), lowStock: products.filter((product) => product.category === category && product.stockQuantity <= LOW_STOCK_THRESHOLD).length })), bySupplier: suppliers.map(([supplier, value]) => ({ supplier, ...value, stockValue: products.filter((product) => product.supplier === supplier).reduce((sum, product) => sum + product.price * product.stockQuantity, 0), lowStock: products.filter((product) => product.supplier === supplier && product.stockQuantity <= LOW_STOCK_THRESHOLD).length })), reorderStatuses: statusValues.map((status) => ({ status, count: requests.filter((request) => request.status === status).length })) }; },
};
