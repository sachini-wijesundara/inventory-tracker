import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';
import { CreateProductDto, UpdateProductDto, PaginationQuery, Product } from '../types';
import { toCsv, parseCsv } from '../utils/csv';

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

// GET /products/export/csv
router.get('/export/csv', (_req: Request, res: Response) => {
  const db = getDb();

  const products = db.prepare(`
    SELECT p.name, p.sku, p.description, c.name as category_name,
           p.quantity, p.min_quantity, p.price, p.unit, p.status
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.name ASC
  `).all() as Record<string, string | number>[];

  const csv = toCsv(
    ['name', 'sku', 'description', 'category', 'quantity', 'min_quantity', 'price', 'unit', 'status'],
    products.map(p => [p.name, p.sku, p.description, p.category_name, p.quantity, p.min_quantity, p.price, p.unit, p.status])
  );

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
  res.send(csv);
});

// POST /products/import/csv
router.post('/import/csv', (req: Request, res: Response) => {
  const db = getDb();
  const csvText = req.body?.csv as string;

  if (!csvText?.trim()) {
    return res.status(400).json({ message: 'CSV content is required' });
  }

  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return res.status(400).json({ message: 'No data rows found in CSV' });
  }

  const result = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

  const getCategoryId = db.prepare('SELECT id FROM categories WHERE name = ? COLLATE NOCASE');
  const getBySku = db.prepare('SELECT id FROM products WHERE sku = ?');
  const insert = db.prepare(`
    INSERT INTO products (id, name, sku, description, category_id, quantity, min_quantity, price, unit, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const update = db.prepare(`
    UPDATE products SET name=?, description=?, category_id=?, quantity=?, min_quantity=?, price=?, unit=?, status=?, updated_at=datetime('now')
    WHERE sku=?
  `);

  db.transaction(() => {
    rows.forEach((row, i) => {
      const line = i + 2;
      const name = row.name || row['product name'];
      const sku = row.sku;
      if (!name || !sku) {
        result.errors.push(`Row ${line}: name and sku are required`);
        result.skipped++;
        return;
      }

      const categoryName = row.category || row.category_name;
      let categoryId: string | null = null;
      if (categoryName) {
        const cat = getCategoryId.get(categoryName) as { id: string } | undefined;
        if (!cat) {
          result.errors.push(`Row ${line}: category "${categoryName}" not found`);
          result.skipped++;
          return;
        }
        categoryId = cat.id;
      }

      const quantity = Number(row.quantity) || 0;
      const minQuantity = Number(row.min_quantity || row['min quantity']) || 0;
      const price = Number(row.price) || 0;
      const unit = row.unit || 'pcs';
      const status = ['active', 'inactive', 'discontinued'].includes(row.status) ? row.status : 'active';
      const description = row.description || null;

      const existing = getBySku.get(sku) as { id: string } | undefined;
      if (existing) {
        update.run(name, description, categoryId, quantity, minQuantity, price, unit, status, sku);
        result.updated++;
      } else {
        insert.run(uuidv4(), name, sku, description, categoryId, quantity, minQuantity, price, unit, status);
        result.created++;
      }
    });
  })();

  res.json({ data: result, message: `Import complete: ${result.created} created, ${result.updated} updated` });
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
