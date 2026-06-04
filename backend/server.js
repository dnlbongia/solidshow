const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

const UPLOADS_DIR = path.join(__dirname, '..', 'assets', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..')));

app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/eventos', require('./routes/eventos'));
app.use('/api/reservas', require('./routes/reservas'));
app.use('/api/testimonios', require('./routes/testimonios'));
app.use('/api/galeria', require('./routes/galeria'));
app.use('/api/tipos-eventos', require('./routes/tiposEventos'));

app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

async function ensureDatabase() {
  try {
    const { getDatabase } = require('./database');
    const db = getDatabase();
    const [tables] = await db.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = (SELECT DATABASE())"
    );
    const existing = tables.map(t => t.TABLE_NAME);

    if (!existing.includes('settings')) {
      console.log('  → Running schema setup...');
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.toUpperCase().startsWith('CREATE DATABASE') && !s.toUpperCase().startsWith('USE '));
      for (const stmt of statements) {
        try { await db.execute(stmt); } catch (e) {
          if (e.code === 'ER_TABLE_EXISTS_ERROR') continue;
          throw e;
        }
      }
      const seed = require('./seed');
      await seed();
      console.log('  → Database ready');
    }
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.warn('  ⚠ Database not available yet, app will start without DB');
    } else {
      console.error('  ⚠ DB init error:', err.message);
    }
  }
}

ensureDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`\n  🚀 SolidShow backend ready`);
    console.log(`  📍 http://localhost:${PORT}`);
    console.log(`  🔧 Admin: http://localhost:${PORT}/admin\n`);
  });
});
