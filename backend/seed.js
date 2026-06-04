const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const bcrypt = require('bcryptjs');
const { getDatabase } = require('./database');

async function seed() {
  const db = getDatabase();

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = bcrypt.hashSync(password, 10);

  await db.execute(
    `INSERT INTO users (username, password) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password = VALUES(password)`,
    [username, hash]
  );
  console.log(`✓ Admin user "${username}" ready`);

  const defaults = [
    ['site_name', 'SolidShow'],
    ['site_description', 'Hacemos de tu evento una experiencia inolvidable'],
    ['contact_email', 'hola@solidshow.mx'],
    ['contact_phone', '+52 55 1234 5678'],
    ['contact_address', 'Av. Reforma 350, Col. Juárez, CDMX'],
    ['reservas_email', 'reservas@solidshow.mx'],
    ['hero_title', 'Hacemos de tu evento una experiencia inolvidable'],
    ['hero_subtitle', 'Organizamos eventos corporativos y sociales con creatividad, profesionalismo y pasión.'],
    ['social_facebook', '#'],
    ['social_instagram', '#'],
    ['social_twitter', '#'],
    ['social_linkedin', '#'],
  ];

  for (const [key, value] of defaults) {
    await db.execute(
      `INSERT INTO settings (\`key\`, \`value\`, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), updated_at = CURRENT_TIMESTAMP`,
      [key, value]
    );
  }
  console.log(`✓ ${defaults.length} default settings loaded`);

  // Insert default tipos_eventos if missing
  const [existing] = await db.execute('SELECT COUNT(*) AS cnt FROM tipos_eventos');
  if (existing[0].cnt === 0) {
    const tipos = [
      ['corporativos',  'fa-briefcase', 'Corporativos',        'Conferencias, lanzamientos, convenciones y team building con estándar profesional.', 1],
      ['sociales',      'fa-ring',      'Sociales',             'Bodas, cumpleaños, aniversarios y celebraciones familiares inolvidables.',            2],
      ['conciertos',    'fa-music',     'Fiestas & Conciertos', 'Producción completa de eventos musicales con sonido, iluminación y logística.',         3],
      ['talleres',      'fa-chalkboard','Talleres & Seminarios', 'Espacios formativos con materiales, facilitadores y certificación incluida.',           4],
    ];
    for (const [section, icon, title, desc, ord] of tipos) {
      await db.execute(
        'INSERT INTO tipos_eventos (section, icon, title, description, ord) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=title',
        [section, icon, title, desc, ord]
      );
    }
    console.log(`✓ ${tipos.length} default event types loaded`);
  }

  console.log('\n✅ Seed complete.');
}

if (require.main === module) {
  seed().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}

module.exports = seed;
