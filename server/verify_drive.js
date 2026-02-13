const { isConnected, validateConnection, listFiles } = require('./services/driveService');

const testDrive = async () => {
    try {
        console.log("1. Checking Drive Connection Local State...");
        const connected = isConnected();
        console.log("Local Connected Status:", connected);

        console.log("2. Validating Connection with API...");
        const valid = await validateConnection();
        console.log("API Valid Status:", valid);

        if (valid) {
             console.log("✅ Drive is Ready and Connected!");
        } else {
             console.error("❌ Drive is NOT Connected. User needs to re-authenticate.");
        }

    } catch (e) {
        console.error("❌ Drive Test Failed:", e);
    }
};

testDrive();
