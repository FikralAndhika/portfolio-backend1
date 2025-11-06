const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Koneksi ke DB berhasil!",
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal koneksi ke DB",
      error: error.message,
    });
  }
};