const express = require('express');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }
    const db = getDatabase();
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = generateToken(user.id);
    res.json({ token, username: user.username });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
