const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS about (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        level VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS experience (
        id SERIAL PRIMARY KEY,
        role VARCHAR(255),
        company VARCHAR(255),
        period VARCHAR(255),
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS certifications (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        issuer VARCHAR(255),
        year VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        description TEXT,
        link VARCHAR(255)
      );
    `);

    console.log("✅ Semua tabel berhasil dibuat!");
  } catch (error) {
    console.error("❌ Error saat migrate:", error);
  } finally {
    pool.end();
  }
}

migrate();
