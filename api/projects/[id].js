const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { id } = req.query;
    
    // GET single project by ID
    if (req.method === 'GET') {
      if (!id) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const result = await pool.query(
        'SELECT * FROM projects WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    // PUT - Update project by ID
    if (req.method === 'PUT') {
      if (!id) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const { title, description, images, tags, github } = req.body;

      // Validasi input
      if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
      }

      // Pastikan images adalah array
      const imageArray = Array.isArray(images) ? images : [];
      const tagsArray = Array.isArray(tags) ? tags : [];

      const result = await pool.query(
        `UPDATE projects 
         SET title = $1, 
             description = $2, 
             images = $3, 
             tags = $4, 
             github = $5,
             updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [title, description, imageArray, tagsArray, github, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      return res.status(200).json({
        message: 'Project updated successfully',
        project: result.rows[0]
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      detail: error.detail || 'No additional details'
    });
  }
};