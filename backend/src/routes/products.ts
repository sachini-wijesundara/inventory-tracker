import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';
import { CreateProductDto, UpdateProductDto, PaginationQuery, Product } from '../types';

const router = Router();

// GET /products
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { page = 1, limit = 10, search, category_id, status, low_stock, out_of_stock }: PaginationQuery = req.query as PaginationQuery;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const offset = (pageNum - 1) * limitNum;

  let whereConditions: string[] = [];
  const params: (string | number)[] = [];

  if (search) {
    whereConditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category_id) {
    whereConditions.push('p.category_id = ?');
    params.push(category_id);
  }
  if (status) {
    whereConditions.push('p.status = ?');
    params.push(status);
  }
  if (low_stock === 'true') {
    whereConditions.push('p.quantity <= p.min_quantity');
  }
  if (out_of_stock === 'true') {
    whereConditions.push('p.quantity = 0');
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const total = (db.prepare(`
    SELECT COUNT(*) as count FROM products p ${whereClause}
  `).get(...params) as { count: number }).count;

  const products = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limitNum, offset) as Product[];

  res.json({
    data: products,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

// GET /products/stats
router.get('/stats', (_req: Request, res: Response) => {
  const db = getDb();

  const totalProducts = (db.prepare('SELECT COUNT(*) as count FROM products WHERE status = ?').get('active') as { count: number }).count;
  const lowStock = (db.prepare('SELECT COUNT(*) as count FROM products WHERE quantity <= min_quantity AND status = ?').get('active') as { count: number }).count;
  const outOfStock = (db.prepare('SELECT COUNT(*) as count FROM products WHERE quantity = 0 AND status = ?').get('active') as { count: number }).count;
  const totalValue = (db.prepare('SELECT COALESCE(SUM(quantity * price), 0) as value FROM products WHERE status = ?').get('active') as { value: number }).value;
  const totalCategories = (db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }).count;

  res.json({
    data: {
      totalProducts,
      lowStock,
      outOfStock,
      totalValue,
      totalCategories,
    },
  });
});

// GET /products/:id
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const product = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(req.params.id) as Product | undefined;

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json({ data: product });
});

// POST /products
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const body: CreateProductDto = req.body;

  if (!body.name || !body.sku) {
    return res.status(400).json({ message: 'Name and SKU are required' });
  }

  // Check SKU uniqueness
  const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(body.sku);
  if (existing) {
    return res.status(409).json({ message: 'SKU already exists' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO products (id, name, sku, description, category_id, quantity, min_quantity, price, unit, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    body.name,
    body.sku,
    body.description ?? null,
    body.category_id ?? null,
    body.quantity ?? 0,
    body.min_quantity ?? 0,
    body.price ?? 0,
    body.unit ?? 'pcs',
    body.status ?? 'active'
  );

  const product = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(id);

  res.status(201).json({ data: product, message: 'Product created successfully' });
});

// PATCH /products/:id
router.patch('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const body: UpdateProductDto = req.body;
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Product | undefined;
  if (!existing) {
    return res.status(404).json({ message: 'Product not found' });
  }

  if (body.sku && body.sku !== existing.sku) {
    const skuConflict = db.prepare('SELECT id FROM products WHERE sku = ? AND id != ?').get(body.sku, id);
    if (skuConflict) {
      return res.status(409).json({ message: 'SKU already exists' });
    }
  }

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  const updatable: (keyof UpdateProductDto)[] = ['name', 'sku', 'description', 'category_id', 'quantity', 'min_quantity', 'price', 'unit', 'status'];
  for (const key of updatable) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(body[key] as string | number | null);
    }
  }

  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
  }

  const updated = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(id);

  res.json({ data: updated, message: 'Product updated successfully' });
});

// DELETE /products/:id
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ message: 'Product not found' });
  }

  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ message: 'Product deleted successfully' });
});

export default router;
