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

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
  `);

  // Seed categories if empty
  const count = database.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number };
  if (count.c === 0) {
    seedData(database);
  }
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
}
