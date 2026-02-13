const { uploadToSupabase, deleteFromSupabase } = require('./services/supabaseService');

const testStorage = async () => {
    try {
        console.log("1. Testing Supabase Upload...");
        const buffer = Buffer.from("Hello Supabase!");
        const filename = "test_upload.txt";
        const mimeType = "text/plain";

        const url = await uploadToSupabase(buffer, filename, mimeType);
        console.log("✅ Upload-Successful! URL:", url);

        console.log("2. Testing Supabase Delete...");
        await deleteFromSupabase(url);
        console.log("✅ Delete Successful!");

    } catch (e) {
        console.error("❌ Storage Test Failed:", e);
        if (e.message.includes("violates row-level security")) {
            console.error("💡 HINT: You might need to disable RLS or add a policy for the 'posters' bucket in Supabase Dashboard.");
        }
    }
};

testStorage();
