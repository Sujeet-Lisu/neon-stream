const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');

const KEY_FILE_PATH = path.join(__dirname, 'google_credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const SHARED_FOLDER_ID = '16IN_mnmqPHNyhkdyzTcXdxKSAZEQ-T74';

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE_PATH,
  scopes: SCOPES,
});

const creds = require('./google_credentials.json');
console.log("Authenticated as:", creds.client_email);

const drive = google.drive({ version: 'v3', auth });

async function searchFolder() {
    try {
        console.log(`Searching for folder: MovieUploads`);
        const res = await drive.files.list({
            q: "name = 'MovieUploads' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id, name, driveId, owners, capabilities)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });
        
        console.log("Search Results:", JSON.stringify(res.data.files, null, 2));
    } catch (err) {
        console.error("Error searching folder:", err.message);
        if(err.response) console.error(err.response.data);
    }
}

searchFolder();
