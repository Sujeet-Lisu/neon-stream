const { google } = require('googleapis');
const path = require('path');
const creds = require('./google_credentials.json');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'google_credentials.json'),
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });

async function checkQuota() {
    try {
        console.log("Checking quota for:", creds.client_email);
        const res = await drive.about.get({
            fields: 'storageQuota, user'
        });
        console.log("User:", res.data.user.displayName);
        console.log("Email:", res.data.user.emailAddress);
        console.log("Quota:", JSON.stringify(res.data.storageQuota, null, 2));
    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkQuota();
