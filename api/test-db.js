const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_DRf8APrVB9Sn@ep-tiny-unit-a17d680w-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require', // PASTE DARI NEON
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error:', err.message);
  } else {
    console.log('✅ Connected!', res.rows[0]);
  }
  pool.end();
});