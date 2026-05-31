import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { getDb } from '../database';
import { authenticate, signToken, AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail } from '../services/email';
import { User } from '../types';

const router = Router();

// POST /auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as User | undefined;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = signToken({ id: user.id, email: user.email, name: user.name });
  res.json({
    data: { token, user: { id: user.id, email: user.email, name: user.name } },
    message: 'Login successful',
  });
});

// GET /auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ data: req.user });
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const db = getDb();
  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email.toLowerCase()) as { id: string; email: string } | undefined;

  // Always return success to prevent email enumeration
  const successMessage = 'If an account exists with that email, a reset link has been sent.';

  if (!user) {
    return res.json({ message: successMessage });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);
  db.prepare('INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)')
    .run(uuidv4(), user.id, tokenHash, expiresAt);

  try {
    await sendPasswordResetEmail(user.email, token);
  } catch (err) {
    console.error('Failed to send reset email:', err);
    return res.status(500).json({ message: 'Failed to send reset email. Check SMTP configuration.' });
  }

  res.json({ message: successMessage });
});

// POST /auth/reset-password
router.post('/reset-password', (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const db = getDb();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = db.prepare(`
    SELECT prt.*, u.email FROM password_reset_tokens prt
    JOIN users u ON u.id = prt.user_id
    WHERE prt.token_hash = ? AND prt.expires_at > datetime('now')
  `).get(tokenHash) as { id: string; user_id: string; email: string } | undefined;

  if (!record) {
    return res.status(400).json({ message: 'Invalid or expired reset link' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  db.transaction(() => {
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
      .run(passwordHash, record.user_id);
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(record.user_id);
  })();

  res.json({ message: 'Password reset successful. You can now log in.' });
});

export default router;
