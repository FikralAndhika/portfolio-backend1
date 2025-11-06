const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.stack);
    return;
  }
  console.log('✅ Connected to PostgreSQL database');
  release();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Portfolio Backend API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      testDB: '/test-db',
      projects: '/projects',
      about: '/about',
      skills: '/skills',
      experiences: '/experiences',
      certifications: '/certifications'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running!' });
});

// Test DB
app.get("/test-db", async (req, res) => {
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
});

// ==================== PROJECTS ====================
app.get('/projects', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM projects ORDER BY created_at DESC';
    let values = [];

    if (category && category !== 'all') {
      query = 'SELECT * FROM projects WHERE category = $1 ORDER BY created_at DESC';
      values = [category];
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/projects', async (req, res) => {
  try {
    const { title, description, image, tags, github, demo, category } = req.body;
    
    const result = await pool.query(
      `INSERT INTO projects (title, description, image, tags, github, demo, category) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [title, description, image, tags, github, demo, category]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image, tags, github, demo, category } = req.body;
    
    const result = await pool.query(
      `UPDATE projects 
       SET title = $1, description = $2, image = $3, tags = $4, 
           github = $5, demo = $6, category = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 
       RETURNING *`,
      [title, description, image, tags, github, demo, category, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ABOUT ====================
app.get('/about', async (req, res) => {
  try {
    console.log('📖 GET /about - Fetching about data');
    const result = await pool.query('SELECT * FROM about LIMIT 1');
    
    if (result.rows.length === 0) {
      console.log('⚠️ No about data found, returning defaults');
      return res.json({
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
        bio1: "Saya adalah seorang Web Developer dengan passion dalam menciptakan aplikasi web yang inovatif dan user-friendly.",
        bio2: "Saya selalu antusias untuk belajar teknologi baru dan mengikuti perkembangan tren di dunia web development.",
        stats: [
          { label: "Years Experience", value: "3+" },
          { label: "Projects Completed", value: "20+" },
          { label: "Happy Clients", value: "15+" },
          { label: "Technologies", value: "10+" }
        ]
      });
    }
    
    const about = result.rows[0];
    console.log('✅ About data found, ID:', about.id);
    res.json({
      profileImage: about.profile_image,
      bio1: about.bio1,
      bio2: about.bio2,
      stats: about.stats
    });
  } catch (err) {
    console.error('❌ Error in GET /about:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/about', async (req, res) => {
  try {
    console.log('📝 PUT /about - Request received');
    const { profileImage, bio1, bio2, stats } = req.body;
    
    console.log('📦 Data received:', {
      hasImage: !!profileImage,
      imageLength: profileImage?.length || 0,
      bio1Length: bio1?.length || 0,
      bio2Length: bio2?.length || 0,
      statsCount: Array.isArray(stats) ? stats.length : 0
    });
    
    const checkResult = await pool.query('SELECT id FROM about LIMIT 1');
    
    let result;
    if (checkResult.rows.length === 0) {
      console.log('🆕 Creating new about record');
      result = await pool.query(
        `INSERT INTO about (profile_image, bio1, bio2, stats) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [profileImage, bio1, bio2, JSON.stringify(stats)]
      );
    } else {
      const id = checkResult.rows[0].id;
      console.log('✏️ Updating existing about record, ID:', id);
      result = await pool.query(
        `UPDATE about 
         SET profile_image = $1, bio1 = $2, bio2 = $3, stats = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5 
         RETURNING *`,
        [profileImage, bio1, bio2, JSON.stringify(stats), id]
      );
    }
    
    const about = result.rows[0];
    console.log('✅ About saved successfully!');
    console.log('📸 Image saved, length:', about.profile_image?.length || 0);
    
    res.json({
      profileImage: about.profile_image,
      bio1: about.bio1,
      bio2: about.bio2,
      stats: about.stats
    });
  } catch (err) {
    console.error('❌ Error in PUT /about:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// ==================== SKILLS ====================
app.get('/skills', async (req, res) => {
  try {
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
    
    res.json(grouped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/skills', async (req, res) => {
  try {
    const { category, name, level } = req.body;
    
    const result = await pool.query(
      'INSERT INTO skills (category, name, level) VALUES ($1, $2, $3) RETURNING *',
      [category, name, level]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/skills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM skills WHERE id = $1', [id]);
    res.json({ message: 'Skill deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== EXPERIENCES ====================
app.get('/experiences', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM experiences ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/experiences', async (req, res) => {
  try {
    const { year, position, company, description, achievements } = req.body;
    
    const result = await pool.query(
      `INSERT INTO experiences (year, position, company, description, achievements) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [year, position, company, description, achievements]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/experiences/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { year, position, company, description, achievements } = req.body;
    
    const result = await pool.query(
      `UPDATE experiences 
       SET year = $1, position = $2, company = $3, description = $4, 
           achievements = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 
       RETURNING *`,
      [year, position, company, description, achievements, id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/experiences/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM experiences WHERE id = $1', [id]);
    res.json({ message: 'Experience deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== CERTIFICATIONS ====================
app.get('/certifications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM certifications ORDER BY year DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/certifications', async (req, res) => {
  try {
    const { title, issuer, year, icon } = req.body;
    
    const result = await pool.query(
      'INSERT INTO certifications (title, issuer, year, icon) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, issuer, year, icon]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/certifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, issuer, year, icon } = req.body;
    
    const result = await pool.query(
      `UPDATE certifications 
       SET title = $1, issuer = $2, year = $3, icon = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING *`,
      [title, issuer, year, icon, id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/certifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM certifications WHERE id = $1', [id]);
    res.json({ message: 'Certification deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PENTING: Export untuk Vercel serverless
module.exports = app;