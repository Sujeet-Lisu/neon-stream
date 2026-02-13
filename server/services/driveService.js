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
    
    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
      supportsAllDrives: true
    });

    const fileId = response.data.id;
    
    // Make file public
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return response.data.webViewLink;

  } catch (error) {
    if (error.code === 401 || (error.response && error.response.status === 401)) {
        console.error("Drive Token Expired/Invalid.");
        throw new Error("Drive Token Expired. Please Re-connect in Admin Panel.");
    }
    console.error('Drive Upload Error:', error);
    throw error;
  }
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

module.exports = { 
    uploadToDrive, 
    deleteFromDrive,
    getAuthUrl, 
    saveToken, 
    isConnected,
    validateConnection
};
