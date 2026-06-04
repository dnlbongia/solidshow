const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

let pool;

function resolveConfig() {
  // Soporte para Railway MySQL add-on (MYSQL_URL, DATABASE_URL, o variables individuales)
  const urlStr = process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (urlStr) {
    const url = new URL(urlStr);
    const cfg = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
    };
    console.log(`  → DB config from URL: ${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database}`);
    return cfg;
  }

  // Soporte para Railway MySQL add-on (variables individuales) y local dev
  const host = process.env.MYSQLHOST || process.env.DB_HOST;
  const port = process.env.MYSQLPORT || process.env.DB_PORT;
  const user = process.env.MYSQLUSER || process.env.DB_USER;
  const password = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD;
  const database = process.env.MYSQLDATABASE || process.env.DB_NAME;

  if (host) {
    const cfg = {
      host,
      port: parseInt(port) || 3306,
      user: user || 'root',
      password: password || '',
      database: database || 'railway',
    };
    console.log(`  → DB config from env vars: ${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database}`);
    return cfg;
  }

  console.log('  ⚠ No DB env vars found, check Railway MySQL add-on is linked to this service');
  return { host: 'localhost', port: 3306, user: 'root', password: '', database: 'solidshow' };
}

function getDatabase() {
  if (!pool) {
    const cfg = resolveConfig();
    pool = mysql.createPool({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      waitForConnections: true,
      connectionLimit: 10,
      timezone: 'Z',
      dateStrings: true,
    });
  }
  return pool;
}

function getConfig() {
  return resolveConfig();
}

function resetPool() {
  if (pool) {
    pool.end().catch(() => {});
    pool = null;
  }
}

module.exports = { getDatabase, getConfig, resetPool };
