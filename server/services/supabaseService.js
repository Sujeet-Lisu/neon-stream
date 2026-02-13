const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'posters';

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Supabase URL or Key missing in .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Uploads a file to Supabase Storage
 * @param {string} filePath - Local path to the file
 * @param {string} filename - Desired filename in Supabase
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
const uploadToSupabase = async (filePath, filename, mimeType) => {
    try {
        const fileBuffer = fs.readFileSync(filePath);

        const { data, error } = await supabase
            .storage
            .from(bucketName)
            .upload(filename, fileBuffer, {
                contentType: mimeType,
                upsert: true
            });

        if (error) throw error;

        const { data: publicUrlData } = supabase
            .storage
            .from(bucketName)
            .getPublicUrl(filename);

        return publicUrlData.publicUrl;
    } catch (err) {
        console.error("Supabase Upload Error:", err);
        throw err;
    }
};

/**
 * Deletes a file from Supabase Storage
 * @param {string} filename - Filename to delete (or full URL, flexible)
 */
const deleteFromSupabase = async (filename) => {
    try {
        // Extract filename if full URL is passed
        const cleanFilename = filename.split('/').pop();

        const { error } = await supabase
            .storage
            .from(bucketName)
            .remove([cleanFilename]);

        if (error) throw error;
        console.log(`Deleted from Supabase: ${cleanFilename}`);
    } catch (err) {
        console.error("Supabase Delete Error:", err);
        // Don't throw, just log. Deletion failure shouldn't crash app flow.
    }
};

module.exports = {
    uploadToSupabase,
    deleteFromSupabase
};
