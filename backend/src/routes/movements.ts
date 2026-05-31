import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';
import { CreateStockMovementDto, Product } from '../types';

const router = Router();

// GET /movements
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { page = 1, limit = 20, product_id } = req.query as { page?: string; limit?: string; product_id?: string };

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const offset = (pageNum - 1) * limitNum;

  const whereClause = product_id ? 'WHERE m.product_id = ?' : '';
  const params: string[] = product_id ? [product_id] : [];

  const total = (db.prepare(`SELECT COUNT(*) as count FROM stock_movements m ${whereClause}`).get(...params) as { count: number }).count;

  const movements = db.prepare(`
    SELECT m.*, p.name as product_name, p.sku as product_sku
    FROM stock_movements m
    LEFT JOIN products p ON m.product_id = p.id
    ${whereClause}
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limitNum, offset);

  res.json({ data: movements, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
});

// POST /movements
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const body: CreateStockMovementDto = req.body;

  if (!body.product_id || !body.type || body.quantity === undefined) {
    return res.status(400).json({ message: 'product_id, type, and quantity are required' });
  }

  if (!['in', 'out', 'adjustment'].includes(body.type)) {
    return res.status(400).json({ message: 'type must be in, out, or adjustment' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(body.product_id) as Product | undefined;
  if (!product) return res.status(404).json({ message: 'Product not found' });

  // Calculate new quantity
  let newQuantity = product.quantity;
  if (body.type === 'in') newQuantity += body.quantity;
  else if (body.type === 'out') newQuantity -= body.quantity;
  else newQuantity = body.quantity; // adjustment sets absolute value

  if (newQuantity < 0) {
    return res.status(400).json({ message: 'Insufficient stock for this operation' });
  }

  const id = uuidv4();

  // Transaction: insert movement + update product quantity
  db.transaction(() => {
    db.prepare('INSERT INTO stock_movements (id, product_id, type, quantity, note) VALUES (?, ?, ?, ?, ?)')
      .run(id, body.product_id, body.type, body.quantity, body.note ?? null);

    db.prepare("UPDATE products SET quantity = ?, updated_at = datetime('now') WHERE id = ?")
      .run(newQuantity, body.product_id);
  })();

  const movement = db.prepare(`
    SELECT m.*, p.name as product_name, p.sku as product_sku
    FROM stock_movements m LEFT JOIN products p ON m.product_id = p.id
    WHERE m.id = ?
  `).get(id);

  res.status(201).json({ data: movement, message: 'Stock movement recorded' });
});

export default router;
