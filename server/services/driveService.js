const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const db = require('../database/db'); // Firestore

// Paths
const CREDENTIALS_PATH = path.join(__dirname, '../client_secret.json');

// Scopes required for uploading
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Load Credentials
let oAuth2Client = null;
let isConnectedState = false;

const initClient = async () => {
  if (fs.existsSync(CREDENTIALS_PATH)) {
    const content = fs.readFileSync(CREDENTIALS_PATH);
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.web;
    oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    
    // Load Token from Firestore
    if (db) {
        try {
            const doc = await db.collection('config').doc('drive_auth').get();
            if (doc.exists) {
                const tokens = doc.data();
                oAuth2Client.setCredentials(tokens);
                isConnectedState = true;
                console.log('OAuth2 Client Initialized with Token (from Firestore).');
            } else {
                console.log('OAuth2 Client Initialized (No Token in Firestore).');
            }
        } catch (e) {
            console.error("Failed to load tokens from component:", e);
        }
    } else {
        console.log("DB not ready, skipping token load.");
    }
  } else {
    console.error("CRITICAL: client_secret.json not found!");
  }
};

// Generate Auth URL
const getAuthUrl = () => {
    if (!oAuth2Client) throw new Error("OAuth Client not initialized (missing client_secret.json)");
    return oAuth2Client.generateAuthUrl({
        access_type: 'offline', // Critical for refresh token
        scope: SCOPES,
    });
};

// Exchange Code for Token and Persist to DB
const saveToken = async (code) => {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    
    if (db) {
        await db.collection('config').doc('drive_auth').set(tokens);
        console.log('Tokens saved to Firestore');
        isConnectedState = true;
    } else {
        console.error("DB not connected, cannot save tokens!");
    }
    
    return tokens;
};

// Check if authenticated
const isConnected = () => {
    return !!oAuth2Client && isConnectedState;
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
    console.error('Drive API Error:', error);
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
        console.error('Drive Delete Error:', error);
        throw error;
    }
}

// Initialize on require, but wait for DB connection implicitly
// We might want to call initClient explicitly in index.js, but keeping it simple:
setTimeout(initClient, 2000); // Give DB a moment to connect

module.exports = { 
    uploadToDrive, 
    deleteFromDrive,
    getAuthUrl, 
    saveToken,
    isConnected
};
