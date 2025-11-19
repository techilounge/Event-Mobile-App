# Deployment Guide

This project can be deployed to Railway.app in minutes!

## Quick Start

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed Railway deployment instructions.

## What's Included

- ✅ Dockerfile for containerized deployment
- ✅ Railway configuration (`backend/railway.json`)
- ✅ Environment variable template (`.env.production`)
- ✅ Health check endpoint
- ✅ Swagger API documentation at `/api-docs`

## Other Deployment Options

- **Render.com**: Use the included `render.yaml`
- **Heroku**: Deploy using the Dockerfile
- **AWS/GCP**: Use Docker container
- **DigitalOcean**: App Platform supports Dockerfile

## After Deployment

1. Test your API: `curl https://your-url.railway.app`
2. Check API docs: `https://your-url.railway.app/api-docs`
3. Update mobile app API URL in `mobileApp/src/services/api.js`
