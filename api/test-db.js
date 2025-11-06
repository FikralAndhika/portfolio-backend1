const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
  try {
    const result = await pool.query("SELECT NOW()");
    return res.json({
      message: "Koneksi ke DB berhasil!",
      data: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal koneksi ke DB",
      error: error.message,
    });
  }
};