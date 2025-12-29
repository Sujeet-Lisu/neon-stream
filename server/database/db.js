const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DBSOURCE = path.join(__dirname, "movies.sqlite");

const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    // Cannot open database
    console.error(err.message);
    throw err;
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            poster_path TEXT,
            video_path TEXT,
            year TEXT,
            views INTEGER DEFAULT 0,
            date_added DATE DEFAULT CURRENT_DATE
            )`,
      (err) => {
        if (err) {
          // Table already created
          console.log('Movies table already initialized.');
        } else {
          // Table just created, inserting some rows?
          console.log('Movies table created.');
        }
      });
  }
});

module.exports = db;
