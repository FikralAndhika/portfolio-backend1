const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
  // CORS Headers - sama seperti experiences
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Ambil ID dari query parameter (untuk GET by ID, PUT, DELETE)
    const { id } = req.query;

    // GET ALL - Ambil semua certifications
    if (req.method === 'GET' && !id) {
      const result = await pool.query('SELECT * FROM certifications ORDER BY year DESC');
      return res.status(200).json(result.rows);
    }

    // GET BY ID - Ambil 1 certification
    if (req.method === 'GET' && id) {
      const result = await pool.query('SELECT * FROM certifications WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Certification not found' });
      }
      
      return res.status(200).json(result.rows[0]);
    }

    // POST - Buat certification baru
    if (req.method === 'POST') {
      const { title, issuer, year, icon } = req.body;
      
      const result = await pool.query(
        'INSERT INTO certifications (title, issuer, year, icon) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, issuer, year, icon]
      );
      
      return res.status(201).json(result.rows[0]);
    }

    // PUT - Update certification
    if (req.method === 'PUT') {
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      const { title, issuer, year, icon } = req.body;
      
      const result = await pool.query(
        `UPDATE certifications 
         SET title = $1, issuer = $2, year = $3, icon = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5 
         RETURNING *`,
        [title, issuer, year, icon, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Certification not found' });
      }
      
      return res.status(200).json(result.rows[0]);
    }

    // DELETE - Hapus certification
    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      const result = await pool.query('DELETE FROM certifications WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Certification not found' });
      }

      return res.status(200).json({ message: 'Certification deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Error in /api/certifications:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};