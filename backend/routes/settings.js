const express = require('express');
const { getDatabase } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const [rows] = await db.execute('SELECT `key`, `value` FROM settings');
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/', authMiddleware, async (req, res) => {
  try {
    const db = getDatabase();
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await db.execute(
        `INSERT INTO settings (\`key\`, \`value\`, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), updated_at = CURRENT_TIMESTAMP`,
        [key, value]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
