const express = require('express');
const { getDatabase } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const [rows] = await db.execute('SELECT * FROM testimonios WHERE published = 1 ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/all', authMiddleware, async (req, res) => {
  try {
    const db = getDatabase();
    const [rows] = await db.execute('SELECT * FROM testimonios ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, role, text, avatar, rating, published } = req.body;
    if (!name || !text) {
      return res.status(400).json({ error: 'Nombre y texto son requeridos' });
    }
    const db = getDatabase();
    const [result] = await db.execute(
      `INSERT INTO testimonios (name, role, text, avatar, rating, published)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, role || '', text, avatar || '', rating || 5, published !== undefined ? published : 1]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, role, text, avatar, rating, published } = req.body;
    const db = getDatabase();
    await db.execute(
      `UPDATE testimonios SET name=?, role=?, text=?, avatar=?, rating=?, published=?
       WHERE id=?`,
      [name, role, text, avatar, rating, published, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDatabase();
    await db.execute('DELETE FROM testimonios WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
