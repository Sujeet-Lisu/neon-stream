const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';
const ADMIN_PASSWORD = 'admin123'; // Default

const runValidation = async () => {
    try {
        // 1. Login
        console.log("🔐 Logging in...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, { password: ADMIN_PASSWORD });
        const token = loginRes.data.token;
        console.log("✅ Login Success! Token:", token.substring(0, 10) + "...");

        // 2. Prepare Files
        const videoPath = path.join(__dirname, 'test_video.mp4');
        const posterPath = path.join(__dirname, 'test_poster.jpg');

        // Create dummy files if not exist
        if (!fs.existsSync(videoPath)) fs.writeFileSync(videoPath, 'dummy video content');
        if (!fs.existsSync(posterPath)) fs.writeFileSync(posterPath, 'dummy poster content');

        // 3. Upload
        console.log("📤 Attempting Upload...");
        const form = new FormData();
        form.append('title', 'Auto Test Movie');
        form.append('description', 'Test Description');
        form.append('year', '2025');
        form.append('video', fs.createReadStream(videoPath));
        form.append('poster', fs.createReadStream(posterPath));

        try {
            const uploadRes = await axios.post(`${API_URL}/upload`, form, {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${token}`
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            console.log("✅ Upload Response:", uploadRes.data);
        } catch (uploadErr) {
            console.error("❌ Upload Failed Status:", uploadErr.response?.status);
            console.error("❌ Upload Failed Data:", JSON.stringify(uploadErr.response?.data, null, 2));
        }

        // Cleanup
        fs.unlinkSync(videoPath);
        fs.unlinkSync(posterPath);

    } catch (e) {
        console.error("❌ Script Error:", e.message);
        if (e.code === 'ECONNREFUSED') {
            console.error("Make sure the server is running on port 5000!");
        }
    }
};

runValidation();
