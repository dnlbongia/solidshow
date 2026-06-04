const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'solidshow_secret_change_in_production';

function generateToken(userId) {
  return jwt.sign({ id: userId }, SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    const decoded = verifyToken(header.split(' ')[1]);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { generateToken, authMiddleware };
