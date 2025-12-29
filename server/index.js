const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database/db');
const fs = require('fs');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const helmet = require('helmet');
require('dotenv').config(); // Load env vars

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow loading resources across origins (needed for frontend to load videos/images)
}));
app.use(cors());
app.use(express.json());

// Serve static files (uploaded images/videos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
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
    
    if (token == null) return res.sendStatus(401);
    if (token !== ADMIN_TOKEN) return res.sendStatus(403);
    
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
app.get('/api/movies', (req, res) => {
  const sql = "SELECT * FROM movies ORDER BY id DESC";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({
      message: "success",
      data: rows
    });
  });
});

// Get Single Movie
app.get('/api/movies/:id', (req, res) => {
  const sql = "SELECT * FROM movies WHERE id = ?";
  const params = [req.params.id];
  db.get(sql, params, (err, row) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({
      message: "success",
      data: row
    });
  });
});

// Increment View Count
app.post('/api/movies/:id/view', (req, res) => {
    const sql = "UPDATE movies SET views = views + 1 WHERE id = ?";
    const params = [req.params.id];
    db.run(sql, params, function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: "View counted", changes: this.changes });
    });
});

// Video Streaming Endpoint
app.get('/api/stream/:filename', (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(__dirname, 'uploads', filename);

  // Check if file exists
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
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Unique filename: fieldname-timestamp.ext
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// NO file filter and NO size limit as requested
const upload = multer({ 
    storage: storage,
    limits: { fileSize: Infinity } 
});

// Helper to generate thumbnail
const generateThumbnail = (videoPath, filename) => {
    return new Promise((resolve, reject) => {
        const thumbnailName = `thumb-${filename.split('.')[0]}.png`;
        const thumbnailPath = path.join(__dirname, 'uploads');
        
        ffmpeg(videoPath)
        .on('end', () => {
            console.log('Thumbnail generated');
            resolve(thumbnailName);
        })
        .on('error', (err) => {
            console.error('Error generating thumbnail:', err);
            // Resolve with null so upload doesn't fail, just no thumb
            resolve(null);
        })
        .screenshots({
            count: 1,
            folder: thumbnailPath,
            filename: thumbnailName,
            size: '320x180' // Standard generic thumb size
        });
    });
};

const { uploadToDrive, deleteFromDrive, getAuthUrl, saveToken, isConnected } = require('./services/driveService');

// -- OAuth 2.0 Flow Routes --

// 1. Check Status
app.get('/api/drive/status', authenticateToken, (req, res) => {
    res.json({ connected: isConnected() });
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
            // Redirect back to Admin Panel (assuming port 5173 for client)
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
  let posterFilename = req.files.poster ? req.files.poster[0].filename : null;
  let videoDriveLink = null;

  if (!isConnected()) {
      return res.status(401).json({ error: "Google Drive not connected. Please connect in Admin Panel." });
  }

  const SHARED_FOLDER_ID = '16IN_mnmqPHNyhkdyzTcXdxKSAZEQ-T74'; // Personal Folder ID

  try {
      // 1. Upload Video to Drive
      console.log(`Uploading ${videoFile.filename} to Drive Folder ${SHARED_FOLDER_ID}...`);
      videoDriveLink = await uploadToDrive(videoFile.path, videoFile.originalname, videoFile.mimetype, SHARED_FOLDER_ID);
      console.log(`Drive Upload Success: ${videoDriveLink}`);
      
      // 2. Delete local video file (temp cleanup)
      fs.unlink(videoFile.path, (err) => {
          if (err) console.error("Failed to delete temp video:", err);
          else console.log("Temp video deleted");
      });

  } catch (driveErr) {
      console.error("Drive Upload Failed:", driveErr);
      return res.status(500).json({ error: "Failed to upload video: " + driveErr.message });
  }

  // Auto-generate thumbnail if no poster (Optional: risky if video deleted, skipping for safer MVP or assuming user provides poster)
  // Logic: For Drive uploads, generating thumbnails from local file *before* delete is possible but complexity. 
  // For MVP SaaS, let's require poster or use default.
  if (!posterFilename) {
      posterFilename = 'default-poster.jpg';
  }

  const sql = "INSERT INTO movies (title, description, poster_path, video_path, year) VALUES (?, ?, ?, ?, ?)";
  // Store the Drive Link in video_path
  const params = [title, description, posterFilename, videoDriveLink, year || '2025'];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      message: "Movie uploaded and processed successfully",
      id: this.lastID,
      data: {
        title,
        video: videoDriveLink,
        poster: posterFilename
      }
    });
  });
});

// Admin Delete Movie
app.delete('/api/movies/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    
    // 1. Get Movie details to find Drive ID
    db.get("SELECT video_path, poster_path FROM movies WHERE id = ?", [id], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Movie not found" });

        try {
            // 2. Delete from Drive if it's a Drive link
            if (row.video_path && row.video_path.includes('drive.google.com')) {
                const fileId = row.video_path.match(/[-\w]{25,}/)?.[0];
                if (fileId) {
                    await deleteFromDrive(fileId);
                }
            }

            // 3. Delete from DB
            db.run("DELETE FROM movies WHERE id = ?", [id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Movie deleted successfully" });
            });

        } catch (e) {
            console.error("Delete Error:", e);
            res.status(500).json({ error: "Failed to delete from Drive" });
        }
    });
});

// Admin Update Movie (Metadata only for now)
app.put('/api/movies/:id', authenticateToken, (req, res) => {
    const { title, description, year } = req.body;
    const id = req.params.id;

    const sql = "UPDATE movies SET title = ?, description = ?, year = ? WHERE id = ?";
    const params = [title, description, year, id];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Movie updated successfully", changes: this.changes });
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
