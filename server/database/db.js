const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../firebase-service-account.json');

let db;

try {
    if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        const serviceAccount = require(SERVICE_ACCOUNT_PATH);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        db = admin.firestore();
        console.log("🔥 Firebase Firestore Connected");
    } else {
        console.error("❌ CRITICAL: firebase-service-account.json missing!");
        console.error("   Please place the file in the 'server' folder.");
        // Initialize with default creds for Render/Cloud if env var set (optional, but stick to file for now)
        // db = null; // App will likely crash on usage, which is intended
    }
} catch (error) {
    console.error("Firebase Init Error:", error);
}

module.exports = db;
