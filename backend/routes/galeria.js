const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'assets', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    cb(null, `${name}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|gif|webp|svg/;
  const videoTypes = /mp4|webm|ogg|mov/;
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (imageTypes.test(ext) || videoTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato no soportado. Usa imágenes (jpg, png, gif, webp) o videos (mp4, webm).'));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo excede el límite de 50MB.' });
    }
    return res.status(400).json({ error: `Error de subida: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
}

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const { section } = req.query;
    let rows;
    if (section) {
      [rows] = await db.execute('SELECT * FROM galeria WHERE section = ? ORDER BY ord ASC, created_at DESC', [section]);
    } else {
      [rows] = await db.execute('SELECT * FROM galeria ORDER BY section ASC, ord ASC, created_at DESC');
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/', authMiddleware, upload.single('file'), handleMulterError, async (req, res) => {
  try {
    const { type, alt, section, ord } = req.body;
    let filename = req.body.filename;

    if (req.file) {
      filename = req.file.filename;
    }

    if (!filename) {
      return res.status(400).json({ error: 'Debes proporcionar un archivo o un nombre de archivo' });
    }

    const detectedType = type || (req.file && req.file.mimetype.startsWith('video/') ? 'video' : 'image');
    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO galeria (type, filename, alt, section, ord) VALUES (?, ?, ?, ?, ?)',
      [detectedType, filename, alt || '', section || 'general', ord || 0]
    );
    res.status(201).json({ id: result.insertId, filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/:id', authMiddleware, upload.single('file'), handleMulterError, async (req, res) => {
  try {
    const db = getDatabase();
    const [items] = await db.execute('SELECT * FROM galeria WHERE id = ?', [req.params.id]);
    if (items.length === 0) return res.status(404).json({ error: 'Item no encontrado' });
    const item = items[0];

    let filename = item.filename;
    if (req.file) {
      const oldPath = path.join(UPLOADS_DIR, item.filename);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      filename = req.file.filename;
    }

    const { type, alt, section, ord } = req.body;
    const detectedType = type || (req.file && req.file.mimetype.startsWith('video/') ? 'video' : item.type);

    await db.execute(
      'UPDATE galeria SET type=?, filename=?, alt=?, section=?, ord=? WHERE id=?',
      [detectedType, filename, alt || '', section || 'general', ord != null ? ord : item.ord, req.params.id]
    );
    res.json({ success: true, filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDatabase();
    const [items] = await db.execute('SELECT * FROM galeria WHERE id = ?', [req.params.id]);
    if (items.length > 0) {
      const filePath = path.join(UPLOADS_DIR, items[0].filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await db.execute('DELETE FROM galeria WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
