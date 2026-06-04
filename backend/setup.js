const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function setup() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const dbName = process.env.DB_NAME || 'solidshow';
  await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.execute(`USE \`${dbName}\``);

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const statements = schema.split(';').filter(s => s.trim());

  for (const stmt of statements) {
    try {
      await connection.execute(stmt.trim());
    } catch (err) {
      if (err.code === 'ER_TABLE_EXISTS_ERROR') continue;
      console.error('Error ejecutando:', stmt.slice(0, 80), '-', err.message);
    }
  }

  console.log('Schema applied successfully');
  await connection.end();
}

setup().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
