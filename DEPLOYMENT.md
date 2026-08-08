# 🚀 Pitch Studio — Deployment Guide

This guide covers how to host Pitch Studio on various platforms including shared hosting (cPanel), VPS, and modern cloud platforms.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Option A: Shared Hosting (cPanel) — Recommended for Beginners](#option-a-shared-hosting-cpanel)
3. [Option B: VPS (DigitalOcean, Linode, Vultr)](#option-b-vps)
4. [Option C: Modern Platforms (Render, Railway, Fly.io)](#option-c-modern-platforms)
5. [Option D: Static Build + Separate API](#option-d-static-build--separate-api)
6. [Environment Variables](#environment-variables)
7. [Database Migration](#database-migration)
8. [SSL / HTTPS Setup](#ssl--https-setup)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js**: v18+ (check with `node -v`)
- **npm**: v9+
- **Build output**: Run `npm run build` locally first
- **Domain name**: Pointed to your server (via A record)

---

## Option A: Shared Hosting (cPanel)

> ⚠️ **Note**: Not all cPanel hosts support Node.js. Verify with your provider that Node.js >= 18 is available. Look for "Node.js Selector" or "Setup Node.js App" in cPanel.

### Step 1: Build Frontend Locally

```bash
npm install
npm run build
```

This creates a `dist/` folder with static files.

### Step 2: Upload Files to cPanel

1. Log into **cPanel File Manager** or use **FTP** (FileZilla)
2. Navigate to `public_html/` (or your subdomain folder)
3. Upload these files:
   - `package.json`
   - `package-lock.json`
   - `server.js`
   - `database.sqlite` (if you have existing data)
   - `dist/` folder (the built frontend)
   - `public/` folder (icons, manifest, service worker)
   - `.env` file (see [Environment Variables](#environment-variables))

### Step 3: Configure Node.js App (if cPanel has Node.js Selector)

1. In cPanel, find **"Setup Node.js App"** or **"Node.js Selector"**
2. Create a new application:
   - **Node.js version**: 18.x or 20.x
   - **Application root**: `/home/username/public_html` (or your folder)
   - **Application URL**: `yourdomain.com` or `subdomain.yourdomain.com`
   - **Application startup file**: `server.js`
3. Click **"Create"**
4. Click **"Run NPM Install"** or open Terminal in cPanel and run:
   ```bash
   cd /home/username/public_html
   npm install --production
   ```
5. Set environment variables in cPanel's **"Node.js App"** panel or create a `.env` file

### Step 4: Configure .env for Production

Create `.env` in your hosting root:

```env
# Server
SERVER_PORT=3001
NODE_ENV=production

# Security (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this

# AI Provider (choose one or configure via admin UI)
OLLAMA_CLOUD_BASE_URL=https://your-ollama-endpoint.com
OLLAMA_CLOUD_API_KEY=your-ollama-api-key
OLLAMA_MODEL=glm-5.2:cloud

# Frontend Origin (your domain)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# SMTP (optional — configure via admin UI)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_SECURE=tls
```

### Step 5: Apache/Nginx Reverse Proxy (if needed)

If your host uses Apache, create/edit `.htaccess` in `public_html/`:

```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} ^yourdomain\.com$ [NC,OR]
RewriteCond %{HTTP_HOST} ^www\.yourdomain\.com$
RewriteCond %{SERVER_PORT} ^80$
RewriteRule ^(.*)$ https://yourdomain.com/$1 [R=301,L]

# Proxy all API and non-file requests to Node.js
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3001/$1 [P,L]
```

> 🔒 Make sure `mod_proxy` and `mod_rewrite` are enabled. Ask your host if unsure.

### Step 6: Start the Server

Via cPanel Terminal or SSH:

```bash
cd /home/username/public_html
node server.js
```

For persistent running, use **PM2** (if available) or cPanel's **"Run as Service"** option.

---

## Option B: VPS (DigitalOcean, Linode, Vultr) — Recommended for Production

### Step 1: Provision Server

- Ubuntu 22.04 LTS
- 1GB+ RAM
- SSH key authentication

### Step 2: Install Node.js & PM2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### Step 3: Upload Code

```bash
# On your local machine
scp -r dist/ package.json package-lock.json server.js public/ user@your-vps-ip:/var/www/pitch-studio/
```

### Step 4: Install Dependencies & Build

```bash
ssh user@your-vps-ip
cd /var/www/pitch-studio
npm install --production
```

### Step 5: Configure Nginx

Create `/etc/nginx/sites-available/pitch-studio`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/pitch-studio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Run with PM2

```bash
cd /var/www/pitch-studio
pm2 start server.js --name "pitch-studio"
pm2 startup
pm2 save
```

### Step 7: SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Option C: Modern Platforms (Render, Railway, Fly.io)

### Render.com (Free Tier Available)

1. Push code to GitHub (already done ✅)
2. Go to https://render.com → **"New Web Service"**
3. Connect your GitHub repo `ukvalley/pitch-studio`
4. Settings:
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.js`
   - **Plan**: Free (sleeps after 15 min inactivity)
5. Add Environment Variables:
   - `JWT_SECRET`, `OLLAMA_CLOUD_BASE_URL`, etc.
6. Deploy!

### Railway.app

1. Go to https://railway.app
2. **"New Project"** → **"Deploy from GitHub repo"**
3. Select `ukvalley/pitch-studio`
4. Add environment variables in **Variables** tab
5. Railway auto-detects Node.js and deploys

### Fly.io

```bash
# Install flyctl
brew install flyctl  # macOS

# Login
fly auth login

# Launch
cd /path/to/pitch-studio
fly launch --name pitch-studio

# Set secrets
fly secrets set JWT_SECRET=your-secret OLLAMA_CLOUD_API_KEY=your-key

# Deploy
fly deploy
```

---

## Option D: Static Build + Separate API

If your host only supports **static HTML** (no Node.js):

1. **Build frontend**:
   ```bash
   npm run build
   ```
2. **Upload `dist/` contents** to `public_html/`
3. **Host API separately** on a Node.js-compatible platform (Render, Railway, VPS)
4. **Update API URL** in `src/api/client.js`:
   ```js
   const API_BASE = 'https://your-api-domain.com/api';
   ```
5. **Rebuild and re-upload**

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SERVER_PORT` | Yes | Port to run Express (default: 3001) |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `OLLAMA_CLOUD_BASE_URL` | No | Ollama API endpoint |
| `OLLAMA_CLOUD_API_KEY` | No | Ollama API key |
| `OLLAMA_MODEL` | No | Default model name |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of frontend URLs |
| `SMTP_HOST` | No | SMTP server hostname |
| `SMTP_PORT` | No | SMTP port (587/465) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password/app password |
| `SMTP_FROM` | No | From email address |
| `SMTP_SECURE` | No | `tls`, `ssl`, or `none` |

---

## Database Migration

Pitch Studio uses **SQLite** (`database.sqlite`).

### First Deploy

The database is auto-created on first run. No migration needed.

### Moving Existing Data

1. Download `database.sqlite` from local machine
2. Upload to server in the same folder as `server.js`
3. Ensure permissions:
   ```bash
   chmod 644 database.sqlite
   chmod 755 /path/to/project
   ```

### Backup

```bash
# Via cron job (daily backup)
0 2 * * * cp /var/www/pitch-studio/database.sqlite /var/backups/pitch-studio-$(date +\%Y\%m\%d).sqlite
```

---

## SSL / HTTPS Setup

### With Cloudflare (Easiest)

1. Add your domain to Cloudflare
2. Set **SSL/TLS mode** to "Full (strict)"
3. Enable **"Always Use HTTPS"**
4. Done! Cloudflare handles SSL automatically.

### With Let's Encrypt (VPS)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Auto-renewal is configured automatically.

---

## Troubleshooting

### "Port already in use" error

```bash
# Find process using port 3001
sudo lsof -i :3001
# Kill it
sudo kill -9 <PID>
```

### "Cannot find module" error

```bash
# Rebuild node_modules
rm -rf node_modules package-lock.json
npm install --production
```

### Frontend shows old version

1. Hard refresh: **Ctrl+F5** (Windows) / **Cmd+Shift+R** (Mac)
2. Clear browser cache and unregister service worker in DevTools → Application → Service Workers
3. Rebuild and redeploy

### SQLite "readonly" error on cPanel

```bash
# Fix permissions
chmod 777 database.sqlite
chmod 777 /path/to/project
```

> ⚠️ On shared hosting, the file owner might differ from the web process. Contact your host or use `php`/`cgi` wrapper if needed.

### CORS errors in browser

Update `ALLOWED_ORIGINS` in `.env` to match your exact domain:

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### "502 Bad Gateway" (Nginx)

```bash
# Check if Node.js app is running
pm2 status
pm2 logs pitch-studio

# Restart if needed
pm2 restart pitch-studio
```

---

## 📦 Quick Deploy Checklist

- [ ] Run `npm run build` locally
- [ ] Set strong `JWT_SECRET` in `.env`
- [ ] Configure `ALLOWED_ORIGINS` with your domain
- [ ] Upload `dist/`, `server.js`, `package.json`, `.env`
- [ ] Run `npm install --production` on server
- [ ] Set up reverse proxy (Apache/Nginx)
- [ ] Configure SSL/HTTPS
- [ ] Test login and AI generation
- [ ] Backup `database.sqlite`

---

## 🆘 Need Help?

- **cPanel issues**: Contact your hosting provider's support
- **VPS issues**: Check `pm2 logs` and Nginx error logs
- **General questions**: Open an issue on GitHub → https://github.com/ukvalley/pitch-studio/issues

---

**Happy hosting! 🎉**
