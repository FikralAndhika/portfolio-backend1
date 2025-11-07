const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
  // CORS Headers - sama seperti experiences
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Ambil ID dari query parameter
    const { id } = req.query;

    // GET - Get all skills grouped by category
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM skills ORDER BY skill_category, level DESC');
      
      const grouped = result.rows.reduce((acc, skill) => {
        if (!acc[skill.skill_category]) {
          acc[skill.skill_category] = [];
        }
        acc[skill.skill_category].push({
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
        'INSERT INTO skills (skill_category, name, level) VALUES ($1, $2, $3) RETURNING *',
        [category, name, level]
      );
      
      return res.status(201).json(result.rows[0]);
    }

    // DELETE - Delete skill
    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      const result = await pool.query('DELETE FROM skills WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Skill not found' });
      }

      return res.status(200).json({ message: 'Skill deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Error in /api/skills:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};