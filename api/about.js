const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
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
    // GET - Get about data
    if (req.method === 'GET') {
      console.log('📖 GET /api/about - Fetching about data');
      const result = await pool.query('SELECT * FROM about LIMIT 1');
      
      if (result.rows.length === 0) {
        console.log('⚠️ No about data found, returning defaults');
        return res.status(200).json({
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
      return res.status(200).json({
        profileImage: about.profile_image,
        bio1: about.bio1,
        bio2: about.bio2,
        stats: about.stats
      });
    }

    // PUT - Update about data
    if (req.method === 'PUT') {
      console.log('📝 PUT /api/about - Request received');
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
      
      return res.status(200).json({
        profileImage: about.profile_image,
        bio1: about.bio1,
        bio2: about.bio2,
        stats: about.stats
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Error in /api/about:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};