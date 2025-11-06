const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET - Get all skills grouped by category
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM skills ORDER BY category, level DESC');
      
      const grouped = result.rows.reduce((acc, skill) => {
        if (!acc[skill.category]) {
          acc[skill.category] = [];
        }
        acc[skill.category].push({
          id: skill.id,
          name: skill.name,
          level: skill.level
        });
        return acc;
      }, {});
      
      return res.status(200).json(grouped);
    }

    // POST - Create new skill
    if (req.method === 'POST') {
      const { category, name, level } = req.body;
      
      const result = await pool.query(
        'INSERT INTO skills (category, name, level) VALUES ($1, $2, $3) RETURNING *',
        [category, name, level]
      );
      
      return res.status(201).json(result.rows[0]);
    }

    // DELETE - Delete skill
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      await pool.query('DELETE FROM skills WHERE id = $1', [id]);
      return res.status(200).json({ message: 'Skill deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};