const db = require('./database/db');

const seedData = async () => {
  const movies = [
    {
      title: "Cyberpunk: Edgerunners",
      description: "In a dystopia riddled with corruption and cybernetic implants, a talented but reckless street kid strives to become an edgerunner: a mercenary outlaw.",
      poster_path: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800",
      video_path: "https://drive.google.com/file/d/FAKE_ID_1/view?usp=sharing", // Placeholder
      year: "2077",
      views: 1337
    },
    {
      title: "Blade Runner 2049",
      description: "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who's been missing for thirty years.",
      poster_path: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800",
      video_path: "https://drive.google.com/file/d/FAKE_ID_2/view?usp=sharing", // Placeholder
      year: "2049",
      views: 892
    }
  ];
  try {
      console.log('🌱 Seeding Database...');
      
      for (const movie of movies) {
        // Correct column order matches VALUES ($1, $2, $3, $4, $5, $6)
        // Adjust query to include 'views'
        const sql = "INSERT INTO movies (title, description, poster_path, video_path, year, views) VALUES ($1, $2, $3, $4, $5, $6)";
        const params = [movie.title, movie.description, movie.poster_path, movie.video_path, movie.year, movie.views];
        await db.query(sql, params);
        console.log(`Inserted: ${movie.title}`);
      }

      console.log('✅ Seeding Complete.');
      process.exit(0);

  } catch (err) {
      console.error('❌ Seeding Failed:', err);
      process.exit(1);
  }
};

seedData();
