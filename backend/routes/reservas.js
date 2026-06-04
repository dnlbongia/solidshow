const express = require('express');
const { getDatabase } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDatabase();
    const { status } = req.query;
    let rows;
    if (status) {
      [rows] = await db.execute('SELECT * FROM reservas WHERE status = ? ORDER BY created_at DESC', [status]);
    } else {
      [rows] = await db.execute('SELECT * FROM reservas ORDER BY created_at DESC');
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, email, telefono, tipo_evento, fecha_evento, invitados, mensaje } = req.body;
    if (!nombre || !email || !telefono || !tipo_evento || !fecha_evento || !invitados) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados' });
    }
    const db = getDatabase();
    const [result] = await db.execute(
      `INSERT INTO reservas (nombre, email, telefono, tipo_evento, fecha_evento, invitados, mensaje)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, email, telefono, tipo_evento, fecha_evento, invitados, mensaje || '']
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pendiente', 'confirmada', 'cancelada'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    const db = getDatabase();
    await db.execute('UPDATE reservas SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDatabase();
    await db.execute('DELETE FROM reservas WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
