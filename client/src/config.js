// Basic configuration for the frontend
// If running locally, force localhost:5000. 
// If deployed/shared (ngrok/tunnel), use the VITE_API_URL or fallback.
export const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
