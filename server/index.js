const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database/db');
const fs = require('fs');
const multer = require('multer');
const { uploadToSupabase, deleteFromSupabase } = require('./services/supabaseService');
const { uploadToDrive, deleteFromDrive, getAuthUrl, saveToken, isConnected, validateConnection } = require('./services/driveService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const helmet = require('helmet');
require('dotenv').config(); // Load env vars

// Security Middleware (Production Ready)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow serving images/videos
}));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173', 
  process.env.CLIENT_URL // Vercel URL
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1 && !origin.includes('vercel.app')) { // Simple wildcard for vercel previews if needed
            // For MVP strictness, maybe just allow * for now if strictly controlled?
            // Let's stick to list + localhost
           // return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
           // For debugging ease during deployment:
           return callback(null, true);
        }
        return callback(null, true);
    }
}));
app.use(express.json());

// Serve static files (Still needed for uploads? No, but maybe temp files or defaults)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists (for temp storage)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Routes
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "neon_fallback_secret";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.status(401).json({ error: "Unauthorized: No Token" });
    if (token !== ADMIN_TOKEN) return res.status(403).json({ error: "Forbidden: Invalid Token" });
    
    next();
};

app.get('/', (req, res) => {
  res.send('Neon Stream API is running...');
});

app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ token: ADMIN_TOKEN });
    } else {
        res.status(401).json({ error: "Invalid Credentials" });
    }
});

// Get All Movies
app.get('/api/movies', async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM movies ORDER BY id DESC");
    res.json({
      message: "success",
      data: rows
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get Single Movie
app.get('/api/movies/:id', async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM movies WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Movie not found" });
    res.json({
      message: "success",
      data: rows[0]
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Increment View Count
app.post('/api/movies/:id/view', async (req, res) => {
    try {
        await db.query("UPDATE movies SET views = views + 1 WHERE id = $1", [req.params.id]);
        res.json({ message: "View counted" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Video Streaming Endpoint (Local Fallback - mostly unused if Drive is active)
app.get('/api/stream/:filename', (req, res) => {
  const filename = req.params.filename;
  // If it's a full URL (Drive/Supabase), this endpoint shouldn't be hit ideally.
  if (filename.startsWith('http')) return res.redirect(filename);

  const videoPath = path.join(__dirname, 'uploads', filename);

  if (!fs.existsSync(videoPath)) {
    return res.status(404).send('Video not found');
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Configure Multer for Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: Infinity } 
});

// -- OAuth 2.0 Flow Routes --

// 1. Check Status
app.get('/api/drive/status', authenticateToken, async (req, res) => {
    const valid = await validateConnection();
    res.json({ connected: valid });
});

// 2. Start Auth (Redirect to Google)
app.get('/api/auth/google', (req, res) => {
    try {
        const url = getAuthUrl();
        res.redirect(url);
    } catch (e) {
        res.status(500).send("Error generating Auth URL: " + e.message);
    }
});

// 3. Callback (Google redirects here with code)
app.get('/api/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    if (code) {
        try {
            await saveToken(code);
            res.send("<h1>Drive Connected Successfully! 🚀</h1><p>You can close this tab and refresh the Admin Panel.</p><script>setTimeout(() => window.close(), 3000);</script>");
        } catch (e) {
            res.status(500).send("Authentication Failed: " + e.message);
        }
    } else {
        res.status(400).send("No code provided");
    }
});

// Admin Upload Endpoint
app.post('/api/upload', authenticateToken, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'poster', maxCount: 1 }]), async (req, res) => {
  const { title, description, year } = req.body;
  
  if (!req.files || !req.files.video) {
    return res.status(400).json({ error: "Missing video file" });
  }

  const videoFile = req.files.video[0];
  const posterFile = req.files.poster ? req.files.poster[0] : null;
  
  let videoDriveLink = null;
  let posterPublicUrl = null;

  if (!isConnected()) {
      return res.status(401).json({ error: "Google Drive not connected. Please connect in Admin Panel." });
  }

  const SHARED_FOLDER_ID = '16IN_mnmqPHNyhkdyzTcXdxKSAZEQ-T74'; // Personal Folder ID

  try {
      // 1. Upload Video to Drive
      console.log(`Uploading ${videoFile.filename} to Drive Folder ${SHARED_FOLDER_ID}...`);
      videoDriveLink = await uploadToDrive(videoFile.path, videoFile.originalname, videoFile.mimetype, SHARED_FOLDER_ID);
      console.log(`Drive Upload Success: ${videoDriveLink}`);

      // 2. Upload Poster to Supabase (if exists)
      if (posterFile) {
          console.log(`Uploading poster ${posterFile.filename} to Supabase...`);
          try {
              posterPublicUrl = await uploadToSupabase(posterFile.path, posterFile.filename, posterFile.mimetype);
              console.log(`Supabase Upload Success: ${posterPublicUrl}`);
          } catch(err) {
              console.error("Poster upload failed, using default", err);
          }
      }

  } catch (driveErr) {
      console.error("Upload Failed:", driveErr);
      // Ensure cleanup happens even on error
      if (fs.existsSync(videoFile.path)) fs.unlink(videoFile.path, () => {});
      if (req.files.poster && fs.existsSync(req.files.poster[0].path)) fs.unlink(req.files.poster[0].path, () => {});
      
      return res.status(500).json({ error: "Failed to upload: " + driveErr.message });
  }

  // Cleanup successful uploads
  if (fs.existsSync(videoFile.path)) fs.unlink(videoFile.path, () => {});
  if (req.files.poster && fs.existsSync(req.files.poster[0].path)) fs.unlink(req.files.poster[0].path, () => {});

  if (!posterPublicUrl) {
      posterPublicUrl = 'https://via.placeholder.com/500x750?text=No+Poster'; // Or a default hosted asset
  }

  try {
      const sql = "INSERT INTO movies (title, description, poster_path, video_path, year) VALUES ($1, $2, $3, $4, $5) RETURNING id";
      const params = [title, description, posterPublicUrl, videoDriveLink, year || '2025'];

      const { rows } = await db.query(sql, params);
      
      res.json({
        message: "Movie uploaded and processed successfully",
        id: rows[0].id,
        data: {
          title,
          video: videoDriveLink,
          poster: posterPublicUrl
        }
      });
  } catch (err) {
      return res.status(500).json({ error: err.message });
  }
});

// Admin Delete Movie
app.delete('/api/movies/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    
    try {
        // 1. Get Movie details
        const { rows } = await db.query("SELECT video_path, poster_path FROM movies WHERE id = $1", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Movie not found" });
        const row = rows[0];

        // 2. Delete from Drive
        if (row.video_path && row.video_path.includes('drive.google.com')) {
            const fileId = row.video_path.match(/[-\w]{25,}/)?.[0];
            if (fileId) await deleteFromDrive(fileId);
        }
        
        // 3. Delete from Supabase
        if (row.poster_path && row.poster_path.includes('supabase')) {
             await deleteFromSupabase(row.poster_path);
        }

        // 4. Delete from DB
        await db.query("DELETE FROM movies WHERE id = $1", [id]);
        res.json({ message: "Movie deleted successfully" });

    } catch (e) {
        console.error("Delete Error:", e);
        res.status(500).json({ error: "Failed to delete movie", details: e.message });
    }
});

// Admin Update Movie
app.put('/api/movies/:id', authenticateToken, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'poster', maxCount: 1 }]), async (req, res) => {
    const id = req.params.id;
    const { title, description, year } = req.body;
    
    try {
        // 1. Get current movie data
        const { rows } = await db.query("SELECT * FROM movies WHERE id = $1", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Movie not found" });
        const row = rows[0];

        let newVideoPath = row.video_path;
        let newPosterPath = row.poster_path;

        // 2. Handle Video Replacement
        if (req.files && req.files['video']) {
            const videoFile = req.files['video'][0];
            
            // Delete old from Drive
            if (row.video_path && row.video_path.includes('drive.google.com')) {
                const oldFileId = row.video_path.match(/[-\w]{25,}/)?.[0];
                if (oldFileId) await deleteFromDrive(oldFileId);
            }

            // Upload new to Drive
            console.log(`Replacing video for movie ${id}...`);
            newVideoPath = await uploadToDrive(videoFile.path, videoFile.originalname, videoFile.mimetype);
            fs.unlinkSync(videoFile.path); // Cleanup
        }

        // 3. Handle Poster Replacement
        if (req.files && req.files['poster']) {
            const posterFile = req.files['poster'][0];
            
            // Delete old from Supabase
            if (row.poster_path && row.poster_path.includes('supabase')) {
                await deleteFromSupabase(row.poster_path);
            }

            // Upload new to Supabase
            console.log(`Replacing poster for movie ${id}...`);
            newPosterPath = await uploadToSupabase(posterFile.path, posterFile.filename, posterFile.mimetype);
            fs.unlinkSync(posterFile.path); // Cleanup
        }

        // 4. Update DB
        const sql = "UPDATE movies SET title = $1, description = $2, year = $3, video_path = $4, poster_path = $5 WHERE id = $6";
        const params = [title, description, year, newVideoPath, newPosterPath, id];

        await db.query(sql, params);
        res.json({ message: "Movie updated successfully" });

    } catch (error) {
        console.error("Update Failed:", error);
        res.status(500).json({ error: "Failed to update movie: " + error.message });
    }
});

// Admin Bulk Cleanup
app.delete('/api/admin/cleanup', authenticateToken, async (req, res) => {
    try {
        const { rows } = await db.query("SELECT id, title, video_path, poster_path FROM movies WHERE title LIKE $1", ['%test%']);
        
        if (rows.length === 0) return res.json({ message: "No test data found.", count: 0 });

        let deletedCount = 0;
        const errors = [];

        for (const row of rows) {
            try {
                // Delete from Drive
                if (row.video_path && row.video_path.includes('drive.google.com')) {
                    const fileId = row.video_path.match(/[-\w]{25,}/)?.[0];
                    if (fileId) await deleteFromDrive(fileId);
                }

                // Delete from Supabase
                if (row.poster_path && row.poster_path.includes('supabase')) {
                    await deleteFromSupabase(row.poster_path);
                }

                // Delete from DB
                await db.query("DELETE FROM movies WHERE id = $1", [row.id]);
                deletedCount++;

            } catch (e) {
                console.error(`Failed to cleanup ID ${row.id}:`, e);
                errors.push({ id: row.id, error: e.message });
            }
        }

        res.json({ 
            message: `Cleanup Complete. Deleted ${deletedCount} movies.`, 
            count: deletedCount,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message,
    stack: err.stack 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
