const { google } = require('googleapis');
const path = require('path');
const creds = require('./google_credentials.json');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'google_credentials.json'),
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });

const FOLDER_ID = '16IN_mnmqPHNyhkdyzTcXdxKSAZEQ-T74';

async function checkFolderType() {
    try {
        console.log(`Inspecting Folder: ${FOLDER_ID}`);
        const res = await drive.files.get({
            fileId: FOLDER_ID,
            fields: 'id, name, mimeType, driveId, owners, capabilities, parents',
            supportsAllDrives: true
        });
        
        const isSharedDrive = !!res.data.driveId;
        const ownerParams = res.data.owners ? res.data.owners.map(o => o.emailAddress) : [];

        console.log("\n--- DIAGNOSTIC RESULTS ---");
        console.log("Folder Name:", res.data.name);
        console.log("Is Shared Drive (Team Drive):", isSharedDrive);
        console.log("Drive ID:", res.data.driveId || "N/A (Personal/Standard Folder)");
        console.log("Owners:", JSON.stringify(ownerParams));
        
        if (!isSharedDrive) {
             console.log("\n❌ CRITICAL ISSUE: This is a Personal/Standard Folder.");
             console.log("   Service Accounts CANNOT upload here because they have 0 bytes of storage.");
             console.log("   They can only upload to Workspace 'Shared Drives' where the Org owns the file.");
        } else {
             console.log("\n✅ This is a Shared Drive. Uploads SHOULD work if role is Content Manager/Contributor.");
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkFolderType();
