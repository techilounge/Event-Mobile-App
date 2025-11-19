# Railway Deployment Guide

## Quick Deploy to Railway.app 🚀

### Prerequisites
- GitHub account
- Your code pushed to GitHub

---

## Step 1: Sign Up for Railway

1. Go to **https://railway.app**
2. Click **"Login with GitHub"**
3. Authorize Railway to access your GitHub repos

---

## Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `Event-Mobile-App-main`
4. Railway will auto-detect the Dockerfile!

---

## Step 3: Configure the Backend Service

### Set Root Directory
1. In Railway dashboard, click on your service
2. Go to **Settings** → **Service Settings**
3. Set **Root Directory** to: `backend`
4. Save changes

### Add Environment Variables
Click **Variables** tab and add these:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=<generate-a-secure-random-string-min-64-chars>
USE_DATABASE=false
USE_FIREBASE=true
CORS_ORIGIN=*
MAX_REQUEST_SIZE=10mb
```

> [!TIP]
> For `JWT_SECRET`, generate a secure random string. You can use:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### Optional: Add PostgreSQL Database
1. Click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway will create a database and provide connection variables
3. Update your environment variables:
   ```
   USE_DATABASE=true
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_NAME=${{Postgres.PGDATABASE}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   ```

---

## Step 4: Deploy!

1. Railway automatically triggers a deployment
2. Watch the **Deployments** tab for build progress
3. Build takes ~2-5 minutes
4. Once deployed, Railway provides a public URL

---

## Step 5: Get Your Backend URL

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy your public URL (e.g., `https://event-backend-production-xxxx.up.railway.app`)

---

## Step 6: Test Your Deployed API

### Test Health Endpoint
```bash
curl https://your-railway-url.railway.app
```

Expected response:
```json
{
  "message": "Backend server is running!",
  "version": "1.0.0",
  "timestamp": "2025-11-18T..."
}
```

### Test Swagger Docs
Visit: `https://your-railway-url.railway.app/api-docs`

---

## Step 7: Update Mobile App

Update the API base URL in your mobile app:

**File**: `mobileApp/src/services/api.js`

Find and update:
```javascript
const API_URL = 'https://your-railway-url.railway.app/api';
```

---

## Troubleshooting

### Build Fails
- Check **Deployments** → **Logs** for errors
- Verify Dockerfile path is correct
- Ensure `backend/` is set as root directory

### Environment Variables Not Working
- Click **Variables** → **Raw Editor** to verify syntax
- Restart deployment after changing variables

### Database Connection Issues
- Verify PostgreSQL service is running
- Check database environment variables match format above
- Look at deployment logs for connection errors

---

## Auto-Deploy on Git Push

Railway automatically deploys when you push to your main branch! 🎉

To trigger a new deployment:
```bash
git add .
git commit -m "Update backend"
git push origin main
```

---

## Monitor Your App

### View Logs
- Go to **Deployments** → Click latest deployment → **View Logs**

### Metrics
- **Metrics** tab shows CPU, Memory, Network usage

### Set Up Alerts
- **Settings** → **Service Settings** → Configure webhooks

---

## Free Tier Limits

Railway's free trial includes:
- $5 free credit
- ~500 hours of usage
- Great for testing and small projects

For production, consider upgrading to the **Developer plan** ($5/month).

---

## Next Steps

Once deployed:
1. ✅ Test all API endpoints
2. ✅ Update mobile app with deployed URL
3. ✅ Test mobile app with deployed backend
4. ✅ Set up monitoring/alerts
5. Consider adding a custom domain

---

## Quick Reference

| Item | Value |
|------|-------|
| **Platform** | Railway.app |
| **Builder** | Docker |
| **Root Directory** | `backend` |
| **Health Check** | `/` |
| **Port** | 3000 |
| **Docs** | `/api-docs` |

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Your deployment logs in Railway dashboard
