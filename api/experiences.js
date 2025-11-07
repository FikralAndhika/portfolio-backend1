const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
  // CORS Headers - PENTING untuk fix error CORS!
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Ambil ID dari URL atau body
    const id = req.query.id || req.body?.id;

    // GET ALL - Ambil semua experiences
    if (req.method === 'GET' && !id) {
      const result = await pool.query('SELECT * FROM experiences ORDER BY created_at DESC');
      return res.status(200).json(result.rows);
    }

    // GET BY ID - Ambil 1 experience
    if (req.method === 'GET' && id) {
      const result = await pool.query('SELECT * FROM experiences WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Experience not found' });
      }
      
      return res.status(200).json(result.rows[0]);
    }

    // POST - Buat experience baru
    if (req.method === 'POST') {
      const { year, position, company, description, achievements } = req.body;
      
      const result = await pool.query(
        `INSERT INTO experiences (year, position, company, description, achievements) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [year, position, company, description, achievements]
      );
      
      return res.status(201).json(result.rows[0]);
    }

    // PUT - Update experience
    if (req.method === 'PUT') {
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      const { year, position, company, description, achievements } = req.body;
      
      const result = await pool.query(
        `UPDATE experiences 
         SET year = $1, position = $2, company = $3, description = $4, 
             achievements = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 
         RETURNING *`,
        [year, position, company, description, achievements, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Experience not found' });
      }
      
      return res.status(200).json(result.rows[0]);
    }

    // DELETE - Hapus experience
    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      const result = await pool.query('DELETE FROM experiences WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Experience not found' });
      }

      return res.status(200).json({ message: 'Experience deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Error in /api/experiences:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};