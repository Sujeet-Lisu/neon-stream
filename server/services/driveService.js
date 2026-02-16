const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const db = require('../database/db'); // Import DB for token persistence

// Internal State
let oAuth2Client = null;
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

/**
 * Initialize OAuth Client using Environment Variables
 */
const initClient = async () => {
  try {
    // 1. Load Credentials (Env Var > File)
    let credentials;
    if (process.env.GOOGLE_CREDENTIALS) {
        credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    } else {
        // Fallback for local dev (if file still exists)
        const credPath = path.join(__dirname, '../client_secret.json');
        if (fs.existsSync(credPath)) {
            credentials = JSON.parse(fs.readFileSync(credPath));
        }
    }

    if (!credentials) {
        console.error("⚠️ Drive Service: Google Credentials not found (Env: GOOGLE_CREDENTIALS or file). Drive features disabled.");
        return;
    }

    const { client_secret, client_id, redirect_uris } = credentials.web;
    oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Auto-Save Refreshed Tokens (Attached immediately after initialization)
    oAuth2Client.on('tokens', (tokens) => {
        if (tokens.refresh_token) {
            console.log("🔄 Drive Service: Received NEW Refresh Token. Saving...");
        }
        // Always save access_token
        const tokenStr = JSON.stringify(tokens);
        db.query("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2", ['drive_token', tokenStr])
          .then(() => console.log("✅ Drive Service: Refreshed Token updated in DB."))
          .catch(err => console.error("❌ Failed to save Refreshed Token:", err));
    });

    // 2. Load Token from DB (Persistent)
    const { rows } = await db.query("SELECT value FROM settings WHERE key = $1", ['drive_token']);
    
    if (rows.length > 0) {
        const token = JSON.parse(rows[0].value);
        oAuth2Client.setCredentials(token);
        console.log('✅ Drive Service: OAuth2 Client Initialized (Token loaded from DB).');
    } else {
        // Fallback: Check local file for backward compatibility/initial migration
        const tokenPath = path.join(__dirname, '../tokens.json');
        if (fs.existsSync(tokenPath)) {
            const tokenStr = fs.readFileSync(tokenPath, 'utf8');
            const token = JSON.parse(tokenStr);
            oAuth2Client.setCredentials(token);
            
            // Migrate to DB
            await db.query("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2", ['drive_token', tokenStr]);
            console.log('✅ Drive Service: Token migrated from file to DB.');
        } else {
            console.log('⚠️ Drive Service: OAuth2 Client Initialized (No Token found). Please Authenticate.');
        }
    }
  } catch (err) {
      console.error("❌ Drive Service Init Error:", err.message);
      // If credentials failed, valid logging helps debug on Render
      if (err.message.includes('JSON')) {
          console.error("💡 Check GOOGLE_CREDENTIALS env var format.");
      }
  }
};

// Trigger initialization
initClient();

// Generate Auth URL
const getAuthUrl = () => {
    if (!oAuth2Client) throw new Error("OAuth Client not initialized (Missing Credentials)");
    return oAuth2Client.generateAuthUrl({
        access_type: 'offline', // Critical for refresh token
        scope: SCOPES,
        prompt: 'consent' // Force approval prompt to ensure Refresh Token is returned
    });
};

// Exchange Code for Token & Save to DB
const saveToken = async (code) => {
    if (!oAuth2Client) throw new Error("OAuth Client not initialized");
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    
    // Save to DB
    const tokenStr = JSON.stringify(tokens);
    await db.query("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2", ['drive_token', tokenStr]);
    
    console.log('✅ Token saved to Database.');
    return tokens;
};

// Check if authenticated
const isConnected = () => {
    // Basic check: do we have credentials set?
    return !!oAuth2Client && !!oAuth2Client.credentials && !!oAuth2Client.credentials.access_token;
};

/**
 * Uploads a file to Google Drive using OAuth Client
 */
/**
 * Uploads a file to Google Drive using OAuth Client (Resumable for HD Quality)
 */
/**
 * Uploads a file to Google Drive using OAuth Client (Resumable for HD Quality)
 */
async function uploadToDrive(filePath, fileName, mimeType, folderId = null) {
  if (!isConnected()) {
      throw new Error("Drive Not Connected: Admin must authenticate via OAuth first.");
  }

  const drive = google.drive({ version: 'v3', auth: oAuth2Client });

  try {
    const fileMetadata = {
      name: fileName,
      parents: folderId ? [folderId] : [] 
    };
    
    // Explicitly set mimeType for the stream to prevent Drive from auto-converting/compressing incorrectly
    const media = {
      mimeType: mimeType, 
      body: fs.createReadStream(filePath, { highWaterMark: 5 * 1024 * 1024 }), // Set Chunk Size to 5MB via stream buffer
    };

    console.log(`Starting Resumable Upload: ${fileName} (${mimeType})`);

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      // Request webContentLink for direct streaming
      fields: 'id, name, mimeType, webViewLink, webContentLink',
      supportsAllDrives: true,
      resumable: true // CRITICAL: Ensures high reliability & quality for large files
    });

    const fileId = response.data.id;
    console.log(`Upload Complete. File ID: ${fileId} | MIME: ${response.data.mimeType}`);
    
    // Make file public
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Return the webContentLink (Direct Stream) as requested
    // Fallback to webViewLink if content link is missing (rare)
    return response.data.webContentLink || response.data.webViewLink;

  } catch (error) {
    if (error.code === 401 || (error.response && error.response.status === 401)) {
        console.error("Drive Token Expired/Invalid.");
        throw new Error("Drive Token Expired. Please Re-connect in Admin Panel.");
    }
    console.error('Drive Upload Error:', error);
    throw error;
  } finally {
      // Guaranteed Cleanup: Ensure temp file is deleted whether upload succeeds or fails.
      try {
          if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Cleanup: Deleted temp file ${filePath}`);
          }
      } catch (cleanupErr) {
          console.error("Cleanup Error:", cleanupErr); 
      }
  }
}

/**
 * Helper to convert Drive View Link to Direct Stream Link
 */
function getDirectLink(viewLink) {
    if (!viewLink) return '';
    if (viewLink.includes('export=download')) return viewLink;
    
    // Extract ID
    const fileId = viewLink.match(/[-\w]{25,}/)?.[0];
    if (!fileId) return viewLink;

    return `https://drive.google.com/uc?id=${fileId}&export=download`;
}

/**
 * Deletes a file from Google Drive
 */
async function deleteFromDrive(fileId) {
    if (!isConnected()) {
        throw new Error("Drive Not Connected");
    }

    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    try {
        await drive.files.delete({ fileId: fileId });
        console.log(`Deleted Drive File: ${fileId}`);
    } catch (error) {
        if (error.code === 404 || error.code === 400 || 
            (error.response && (error.response.status === 404 || error.response.status === 400))) {
            return; // Treat as success
        }
        console.error('Drive Delete Error:', error);
        throw error;
    }
}

async function validateConnection() {
    if (!isConnected()) return false;
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    try {
        await drive.about.get({ fields: 'user' });
        return true;
    } catch (error) {
        console.error("Drive Validation Failed:", error.message);
        return false;
    }
}

async function getDriveFileStream(fileId, req, res) {
    if (!isConnected()) {
        throw new Error("Drive Not Connected");
    }
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    try {
        // 1. Get File Metadata (Content-Length, Content-Type)
        const metadata = await drive.files.get({
            fileId: fileId,
            fields: 'size, mimeType, name'
        });
        
        const fileSize = parseInt(metadata.data.size, 10);
        const mimeType = metadata.data.mimeType;
        const range = req.headers.range;

        // 2. Handle Range Requests (Seeking)
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;

            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': mimeType,
            };
            res.writeHead(206, head);

            // Stream byte range
            const response = await drive.files.get({
                fileId: fileId,
                alt: 'media'
            }, { 
                responseType: 'stream',
                headers: { 'Range': `bytes=${start}-${end}` } 
            });
            
            const stream = response.data;
            
            stream.on('error', (err) => {
                console.error("Stream Data Error:", err);
                res.end();
            });

            stream.pipe(res);

        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': mimeType,
            };
            res.writeHead(200, head);

            // Stream full file
            const response = await drive.files.get({
                fileId: fileId,
                alt: 'media'
            }, { responseType: 'stream' });

            const stream = response.data;
             stream.on('error', (err) => {
                console.error("Stream Data Error:", err);
                res.end();
            });
            stream.pipe(res);
        }

    } catch (error) {
        // Auto-Retry on 401 (Token Expired)
        if (error.code === 401 || (error.response && error.response.status === 401)) {
            console.log("⚠️ 401 in Stream: Attempting to refresh token...");
            try {
                // Force check - fetching a new access token might trigger the 'tokens' event
                await oAuth2Client.getAccessToken(); 
                // Retry the stream ONCE
                console.log("🔄 Token Refreshed. Retrying stream...");
                return getDriveFileStream(fileId, req, res); 
            } catch (refreshErr) {
                 console.error("❌ Refresh Failed inside stream:", refreshErr.message);
                 if (!res.headersSent) res.status(401).send("Stream Failed: Auth Expired");
                 return;
            }
        }

        console.error("Stream Error:", error.message);
        if (!res.headersSent) res.status(500).send("Stream Failed: " + error.message);
    }
}

module.exports = { 
    uploadToDrive, 
    deleteFromDrive,
    getAuthUrl, 
    saveToken, 
    isConnected,
    validateConnection,
    getDriveFileStream // Exported
};
