const db = require('./database/db');

async function checkToken() {
    try {
        const { rows } = await db.query("SELECT value FROM settings WHERE key = 'drive_token'");
        if (rows.length > 0) {
            console.log("TOKEN_FOUND");
            process.exit(0);
        } else {
            console.log("TOKEN_NOT_FOUND");
            process.exit(1);
        }
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkToken();
