# Deploying "Neon Stream" (Free Tier)

This guide covers how to deploy your movie platform using **Render (Backend)** and **Netlify (Frontend)** for free.

## Prerequisites
- [GitHub Account](https://github.com/) (You already have this)
- [Render Account](https://render.com/)
- [Netlify Account](https://netlify.com/)
- Your `server/client_secret.json` and `server/tokens.json` files (Keep them safe!)

---

## Part 1: Backend Deployment (Render)

1.  **New Web Service**:
    - Go to [dashboard.render.com](https://dashboard.render.com/).
    - Click **New +** -> **Web Service**.
    - Connect your GitHub repo (`neon-stream`).

2.  **Configuration**:
    - **Name**: `neon-stream-api` (or similar)
    - **Region**: Closest to you (e.g., Singapore, Frankfurt).
    - **Branch**: `main`
    - **Root Directory**: `server`
    - **Runtime**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `node index.js`
    - **Instance Type**: **Free**

3.  **Environment Variables**:
    - Scroll down to "Environment Variables".
    - Add:
        - `PORT`: `10000` (Render's default)
        - `ADMIN_PASSWORD`: `your_secure_password`
        - `NODE_ENV`: `production`

4.  **Secret Files (Crucial for Google Drive)**:
    - Scroll to "Secret Files" section.
    - **Click "Add Secret File"**.
    - **Filename**: `server/client_secret.json` (Note: Render puts it in root relative to service, try just `client_secret.json` if Root Dir is `server`. *Actually, since Root Directory is `server`, files should be relative to that.* So just `client_secret.json` is likely correct, or `/etc/secrets/...` if using path.
    - *Correction*: Render mounts secret files at the path you specify.
    - **File 1**: Name it `client_secret.json`. Paste the content of your local `server/client_secret.json`.
    - **File 2**: Name it `tokens.json`. Paste the content of your local `server/tokens.json`.

5.  **Deploy**:
    - Click **Create Web Service**.
    - Wait for it to show "Live".
    - **Copy your Backend URL** (e.g., `https://neon-stream-api.onrender.com`).

---

## Part 2: Frontend Deployment (Netlify)

1.  **New Site**:
    - Go to [app.netlify.com](https://app.netlify.com/).
    - Click **Add new site** -> **Import from existing project**.
    - Choose **GitHub** and select `neon-stream`.

2.  **Build Settings**:
    - **Base directory**: `client`
    - **Build command**: `npm run build`
    - **Publish directory**: `client/dist` (Netlify usually auto-detects `dist`, but ensure it looks inside `client`).

3.  **Environment Variables**:
    - Click **Add environment variables**.
    - Key: `VITE_API_URL`
    - Value: `https://neon-stream-api.onrender.com` (Your Render Backend URL from Part 1).
    - *Note: No trailing slash / at the end.*

4.  **Deploy**:
    - Click **Deploy neon-stream**.
    - Wait for "Published".
    - **Copy your Frontend URL** (e.g., `https://neon-stream.netlify.app`).

---

## Part 3: Connect Google OAuth (Important!)

1.  Go to **Google Cloud Console** -> **APIs & Services** -> **Credentials**.
2.  Edit your **OAuth 2.0 Client ID**.
3.  **Authorized Redirect URIs**:
    - Add your **Render Backend URL** + callback path.
    - Example: `https://neon-stream-api.onrender.com/api/auth/google/callback`
4.  Save.

---

## Part 4: Final Verification

1.  Open your **Netlify URL**.
2.  Go to `/admin` (`/admin` might need Netlify redirect rule for Single Page Apps. See below!).
3.  Login.
4.  Try to **Upload** a small video.
    - If it works, your Backend (Render) -> Google Drive connection is solid!

### ⚠️ Fix Refresh 404s (Netlify Redirects)
If refreshing `/admin` gives a 404:
1.  Create a file named `_redirects` inside `client/public/`.
2.  Add this line: `/*  /index.html  200`
3.  Push to GitHub. Netlify will update automatically.
