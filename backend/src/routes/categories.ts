import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';

const router = Router();

// GET /categories
router.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const categories = db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
    GROUP BY c.id
    ORDER BY c.name ASC
  `).all();
  res.json({ data: categories });
});

// GET /categories/:id
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ data: category });
});

// POST /categories
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { name, description } = req.body;

  if (!name) return res.status(400).json({ message: 'Name is required' });

  const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(name);
  if (existing) return res.status(409).json({ message: 'Category already exists' });

  const id = uuidv4();
  db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)').run(id, name, description ?? null);

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.status(201).json({ data: category, message: 'Category created' });
});

// PATCH /categories/:id
router.patch('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const { name, description } = req.body;

  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Category not found' });

  const fields: string[] = [];
  const values: string[] = [];

  if (name) { fields.push('name = ?'); values.push(name); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }

  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
  }

  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.json({ data: updated, message: 'Category updated' });
});

// DELETE /categories/:id
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Category not found' });

  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ message: 'Category deleted' });
});

export default router;
