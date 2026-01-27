const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
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
    // GET all projects or by category
    if (req.method === 'GET') {
      const { category } = req.query;
      let query = 'SELECT * FROM projects ORDER BY created_at DESC';
      let values = [];

      if (category && category !== 'all') {
        query = 'SELECT * FROM projects WHERE category = $1 ORDER BY created_at DESC';
        values = [category];
      }

      const result = await pool.query(query, values);
      return res.status(200).json(result.rows);
    }

    // POST - Create new project
    if (req.method === 'POST') {
      const { title, description, images, tags, github, demo, category } = req.body;
      
      // Validasi images
      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: 'Minimal 1 image harus ada' });
      }
      
      const result = await pool.query(
        `INSERT INTO projects (title, description, images, tags, github, demo, category) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [title, description, images, tags || [], github || '', demo || '', category || 'it']
      );
      
      return res.status(201).json(result.rows[0]);
    }

    // PUT - Update project
    if (req.method === 'PUT') {
      const id = req.query.id || req.body.id;
      const { title, description, images, tags, github, demo, category } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      // Validasi images jika di-update
      if (images !== undefined) {
        if (!Array.isArray(images) || images.length === 0) {
          return res.status(400).json({ error: 'Minimal 1 image harus ada' });
        }
      }
      
      const result = await pool.query(
        `UPDATE projects 
         SET title = COALESCE($1, title), 
             description = COALESCE($2, description), 
             images = COALESCE($3, images), 
             tags = COALESCE($4, tags),
             github = COALESCE($5, github), 
             demo = COALESCE($6, demo), 
             category = COALESCE($7, category),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8 
         RETURNING *`,
        [title, description, images, tags, github, demo, category, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      return res.status(200).json(result.rows[0]);
    }

    // DELETE - Delete project
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Project ID is required' });
      }
      
      const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      return res.status(200).json({ message: 'Project deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};