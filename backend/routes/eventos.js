const express = require('express');
const { getDatabase } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const [rows] = await db.execute('SELECT * FROM eventos ORDER BY date DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/upcoming', async (req, res) => {
  try {
    const db = getDatabase();
    const [rows] = await db.execute(
      'SELECT * FROM eventos WHERE published = 1 AND date >= CURDATE() ORDER BY date ASC LIMIT 6'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const [rows] = await db.execute('SELECT * FROM eventos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, date, time, location, image, ticket_price, ticket_url, published } = req.body;
    if (!title || !date) {
      return res.status(400).json({ error: 'Título y fecha son requeridos' });
    }
    const db = getDatabase();
    const [result] = await db.execute(
      `INSERT INTO eventos (title, description, date, time, location, image, ticket_price, ticket_url, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || '', date, time || '', location || '', image || '', ticket_price || 0, ticket_url || '', published !== undefined ? published : 1]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDatabase();
    const [existing] = await db.execute('SELECT id FROM eventos WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });

    const { title, description, date, time, location, image, ticket_price, ticket_url, published } = req.body;
    await db.execute(
      `UPDATE eventos SET title=?, description=?, date=?, time=?, location=?, image=?, ticket_price=?, ticket_url=?, published=?
       WHERE id=?`,
      [title, description, date, time, location, image, ticket_price, ticket_url, published, req.params.id]
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
    const [result] = await db.execute('DELETE FROM eventos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
