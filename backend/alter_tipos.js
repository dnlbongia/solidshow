const mysql = require('mysql2/promise');
require('dotenv').config();
(async () => {
  const p = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'solidshow',
    waitForConnections: true,
    connectionLimit: 1,
    dateStrings: true,
  });
  try {
    await p.execute("ALTER TABLE tipos_eventos ADD COLUMN image VARCHAR(255) DEFAULT '' AFTER description");
    console.log('Column image added');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('Column already exists');
    else console.error('Error:', e.message);
  }
  try {
    const [r] = await p.execute('DESCRIBE tipos_eventos');
    console.log('Columns:', r.map(c => c.Field).join(', '));
  } finally {
    await p.end();
  }
})();
