const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET - Get all experiences
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM experiences ORDER BY created_at DESC');
      return res.status(200).json(result.rows);
    }

    // POST - Create new experience
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
      const { id, year, position, company, description, achievements } = req.body;
      
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

    // DELETE - Delete experience
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      await pool.query('DELETE FROM experiences WHERE id = $1', [id]);
      return res.status(200).json({ message: 'Experience deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};