const express = require('express');
const { getDatabase } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const [rows] = await db.execute('SELECT * FROM tipos_eventos ORDER BY ord ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { section, icon, title, description, image, ord, published } = req.body;
    if (!section || !title) {
      return res.status(400).json({ error: 'section y title son requeridos' });
    }
    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO tipos_eventos (section, icon, title, description, image, ord, published) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [section, icon || 'fa-folder', title, description || '', image || '', ord || 0, published !== undefined ? published : 1]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un tipo de evento con esa sección' });
    }
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDatabase();
    const [existing] = await db.execute('SELECT id FROM tipos_eventos WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Tipo de evento no encontrado' });

    const { section, icon, title, description, image, ord, published } = req.body;
    await db.execute(
      'UPDATE tipos_eventos SET section=?, icon=?, title=?, description=?, image=?, ord=?, published=? WHERE id=?',
      [section, icon, title, description, image || '', ord, published, req.params.id]
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
    await db.execute('DELETE FROM tipos_eventos WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
