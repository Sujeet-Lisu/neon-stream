const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');

const dbPath = path.join(__dirname, 'movies.sqlite');
const db = new sqlite3.Database(dbPath);

console.log(`Checking DB at: ${dbPath}`);

db.all("SELECT * FROM movies", [], (err, rows) => {
    if (err) {
        console.error("DB Error:", err);
    } else {
        console.log(`DB Rows Found: ${rows.length}`);
        rows.forEach(r => console.log(` - ID: ${r.id}, Title: ${r.title}`));
    }
    db.close();
    
    // Check API
    console.log("\nChecking API...");
    http.get('http://localhost:5000/api/movies', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
             console.log(`API Status: ${res.statusCode}`);
             console.log(`API Body: ${data}`);
        });
    }).on('error', (e) => console.error("API Error:", e));
});
