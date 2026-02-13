const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Assuming default or env

async function runTest() {
    try {
        console.log("1. Authenticating...");
        const authRes = await axios.post(`${SERVER_URL}/api/auth/login`, {
            password: 'admin123' 
        });
        const token = authRes.data.token;
        console.log("   Token received.");

        console.log("2. Preparing Upload...");
        const form = new FormData();
        form.append('title', 'Node Test Upload');
        form.append('description', 'Uploaded via Node CLI test script');
        form.append('year', '2025');
        
        const videoPath = path.join(__dirname, '../test/video/test_video.mp4');
        const posterPath = path.join(__dirname, '../test/thumbnail/thumb.jpg');

        if (!fs.existsSync(videoPath)) throw new Error(`Video not found at ${videoPath}`);
        if (!fs.existsSync(posterPath)) throw new Error(`Poster not found at ${posterPath}`);

        form.append('video', fs.createReadStream(videoPath));
        form.append('poster', fs.createReadStream(posterPath));

        console.log("3. Uploading (this may take a moment)...");
        const uploadRes = await axios.post(`${SERVER_URL}/api/upload`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log("4. Upload Success!");
        console.log("   Response:", uploadRes.data);

    } catch (error) {
        console.error("TEST FAILED:");
        if (error.response) {
            console.error("   Status:", error.response.status);
            console.error("   Data:", error.response.data);
        } else {
            console.error("   Error:", error.message);
        }
        process.exit(1);
    }
}

runTest();
