import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data/inventory.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema(): void {
  const database = db;

  database.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      description TEXT,
      category_id TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      min_quantity INTEGER NOT NULL DEFAULT 0,
      price REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'pcs',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'discontinued')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('in', 'out', 'adjustment')),
      quantity INTEGER NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);
  `);

  // Seed categories if empty
  const count = database.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number };
  if (count.c === 0) {
    seedData(database);
  }

  seedDefaultUser(database);
  seedMovements(database);
}

function seedDefaultUser(database: Database.Database): void {
  const userCount = database.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (userCount.c > 0) return;

  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');
  const passwordHash = bcrypt.hashSync('admin123', 10);

  database.prepare(
    'INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)'
  ).run(uuidv4(), 'admin@stockwise.com', 'Admin', passwordHash);
}

function seedData(database: Database.Database): void {
  const { v4: uuidv4 } = require('uuid');

  const categories = [
    { id: uuidv4(), name: 'Electronics', description: 'Electronic components and devices' },
    { id: uuidv4(), name: 'Office Supplies', description: 'Stationery and office materials' },
    { id: uuidv4(), name: 'Furniture', description: 'Office and warehouse furniture' },
    { id: uuidv4(), name: 'Raw Materials', description: 'Production raw materials' },
  ];

  const insertCat = database.prepare(
    'INSERT INTO categories (id, name, description) VALUES (?, ?, ?)'
  );
  for (const cat of categories) {
    insertCat.run(cat.id, cat.name, cat.description);
  }

  const products = [
    { id: uuidv4(), name: 'Laptop Dell XPS 15', sku: 'ELEC-001', categoryId: categories[0].id, quantity: 24, minQuantity: 5, price: 1299.99, unit: 'pcs', status: 'active' },
    { id: uuidv4(), name: 'USB-C Hub 7-Port', sku: 'ELEC-002', categoryId: categories[0].id, quantity: 3, minQuantity: 10, price: 49.99, unit: 'pcs', status: 'active' },
    { id: uuidv4(), name: 'Wireless Mouse', sku: 'ELEC-003', categoryId: categories[0].id, quantity: 67, minQuantity: 15, price: 29.99, unit: 'pcs', status: 'active' },
    { id: uuidv4(), name: 'A4 Paper Ream', sku: 'OFF-001', categoryId: categories[1].id, quantity: 150, minQuantity: 50, price: 8.99, unit: 'ream', status: 'active' },
    { id: uuidv4(), name: 'Ballpoint Pens Box', sku: 'OFF-002', categoryId: categories[1].id, quantity: 8, minQuantity: 20, price: 12.49, unit: 'box', status: 'active' },
    { id: uuidv4(), name: 'Ergonomic Chair', sku: 'FURN-001', categoryId: categories[2].id, quantity: 12, minQuantity: 3, price: 349.00, unit: 'pcs', status: 'active' },
    { id: uuidv4(), name: 'Standing Desk 140cm', sku: 'FURN-002', categoryId: categories[2].id, quantity: 0, minQuantity: 2, price: 499.00, unit: 'pcs', status: 'active' },
    { id: uuidv4(), name: 'Aluminium Sheet 2mm', sku: 'RAW-001', categoryId: categories[3].id, quantity: 200, minQuantity: 50, price: 15.00, unit: 'kg', status: 'active' },
  ];

  const insertProd = database.prepare(`
    INSERT INTO products (id, name, sku, category_id, quantity, min_quantity, price, unit, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of products) {
    insertProd.run(p.id, p.name, p.sku, p.categoryId, p.quantity, p.minQuantity, p.price, p.unit, p.status);
  }

  // Seed demo movements for chart trends
  seedMovementsForProducts(database, products);
}

function seedMovements(database: Database.Database): void {
  const count = database.prepare('SELECT COUNT(*) as c FROM stock_movements').get() as { c: number };
  if (count.c > 0) return;

  const products = database.prepare('SELECT id, quantity FROM products LIMIT 4').all() as { id: string; quantity: number }[];
  if (products.length === 0) return;

  const { v4: uuidv4 } = require('uuid');
  const insert = database.prepare('INSERT INTO stock_movements (id, product_id, type, quantity, note, created_at) VALUES (?, ?, ?, ?, ?, ?)');

  const demoMovements = [
    { productIdx: 0, type: 'in', qty: 10, daysAgo: 28, note: 'Initial restock' },
    { productIdx: 1, type: 'in', qty: 50, daysAgo: 25, note: 'Supplier delivery' },
    { productIdx: 0, type: 'out', qty: 5, daysAgo: 20, note: 'Sales order' },
    { productIdx: 2, type: 'in', qty: 30, daysAgo: 18, note: 'Bulk purchase' },
    { productIdx: 1, type: 'out', qty: 15, daysAgo: 14, note: 'Warehouse transfer' },
    { productIdx: 3, type: 'in', qty: 100, daysAgo: 10, note: 'Restock' },
    { productIdx: 0, type: 'out', qty: 8, daysAgo: 7, note: 'Customer order' },
    { productIdx: 2, type: 'out', qty: 12, daysAgo: 5, note: 'Sales' },
    { productIdx: 1, type: 'in', qty: 20, daysAgo: 3, note: 'Emergency restock' },
    { productIdx: 3, type: 'out', qty: 25, daysAgo: 1, note: 'Distribution' },
  ];

  for (const m of demoMovements) {
    if (!products[m.productIdx]) continue;
    const createdAt = new Date(Date.now() - m.daysAgo * 86400000).toISOString().slice(0, 19).replace('T', ' ');
    insert.run(uuidv4(), products[m.productIdx].id, m.type, m.qty, m.note, createdAt);
  }
}

function seedMovementsForProducts(database: Database.Database, products: { id: string }[]): void {
  const { v4: uuidv4 } = require('uuid');
  const insert = database.prepare('INSERT INTO stock_movements (id, product_id, type, quantity, note, created_at) VALUES (?, ?, ?, ?, ?, ?)');

  const demoMovements = [
    { productIdx: 0, type: 'in', qty: 10, daysAgo: 28, note: 'Initial restock' },
    { productIdx: 1, type: 'in', qty: 50, daysAgo: 25, note: 'Supplier delivery' },
    { productIdx: 0, type: 'out', qty: 5, daysAgo: 20, note: 'Sales order' },
    { productIdx: 2, type: 'in', qty: 30, daysAgo: 18, note: 'Bulk purchase' },
    { productIdx: 1, type: 'out', qty: 15, daysAgo: 14, note: 'Warehouse transfer' },
    { productIdx: 3, type: 'in', qty: 100, daysAgo: 10, note: 'Restock' },
    { productIdx: 0, type: 'out', qty: 8, daysAgo: 7, note: 'Customer order' },
    { productIdx: 2, type: 'out', qty: 12, daysAgo: 5, note: 'Sales' },
    { productIdx: 1, type: 'in', qty: 20, daysAgo: 3, note: 'Emergency restock' },
    { productIdx: 3, type: 'out', qty: 25, daysAgo: 1, note: 'Distribution' },
  ];

  for (const m of demoMovements) {
    if (!products[m.productIdx]) continue;
    const createdAt = new Date(Date.now() - m.daysAgo * 86400000).toISOString().slice(0, 19).replace('T', ' ');
    insert.run(uuidv4(), products[m.productIdx].id, m.type, m.qty, m.note, createdAt);
  }
}
