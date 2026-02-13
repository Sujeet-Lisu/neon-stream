const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ CRTICAL ERROR: DATABASE_URL is missing in .env");
  console.error("Please add: DATABASE_URL=postgresql://user:pass@host:5432/dbname");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for some cloud providers (e.g., Supabase, Neon)
  }
});

// Initialize Database Table
const initDB = async () => {
    const createMoviesTableQuery = `
        CREATE TABLE IF NOT EXISTS movies (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            poster_path TEXT,
            video_path TEXT,
            year TEXT,
            views INTEGER DEFAULT 0,
            date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const createSettingsTableQuery = `
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `;

    try {
        const client = await pool.connect();
        await client.query(createMoviesTableQuery);
        await client.query(createSettingsTableQuery);
        console.log("✅ PostgreSQL: Tables initialized (movies, settings).");
        client.release();
    } catch (err) {
        console.error("❌ PostgreSQL Initialization Failed:", err.message);
    }
};

initDB();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
