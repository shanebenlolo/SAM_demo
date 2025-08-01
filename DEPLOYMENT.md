# Docker + Render Deployment Guide

This project is configured to deploy as a full-stack application using Docker on Render.

## Architecture

- **Single Docker Container** runs both frontend and backend
- **Express Server** serves the built React app and handles API endpoints
- **Environment Variables** keep your API keys secure
- **All-in-one Solution** - no need for separate frontend/backend deployments

## Setup Instructions

### 1. Repository Preparation

1. Ensure your `.env` file is in `.gitignore` (already configured)
2. Push your project to GitHub
3. Your Replicate API token will be configured in Render dashboard (not in code)

### 2. Deploy to Render

#### Option A: Using render.yaml (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Set the `VITE_REPLICATE_API_TOKEN` environment variable in the dashboard

#### Option B: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Environment**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Plan**: Free
   - **Health Check Path**: `/health`

### 3. Environment Variables

In the Render dashboard, add these environment variables:

- `NODE_ENV` = `production`
- `VITE_REPLICATE_API_TOKEN` = `your-replicate-api-token`

**⚠️ Important**: Your API token is secure on the server and never exposed to users.

## Local Development with Docker

### Build and Run Locally

```bash
# Build the Docker image
docker build -t sam-demo .

# Run the container
docker run -p 3001:3001 --env-file .env sam-demo
```

Your app will be available at `http://localhost:3001`

### Development Mode (Recommended for coding)

```bash
# Install dependencies
npm install

# Start development server (frontend + backend)
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3001`

## Project Structure

```
├── Dockerfile              # Multi-stage Docker build
├── render.yaml             # Render deployment configuration
├── server.js               # Express server (serves React + API)
├── src/                    # React frontend source
├── dist/                   # Built React app (created during Docker build)
├── public/                 # Static files served by Express
└── .env                    # Environment variables (not committed)
```

## How It Works

1. **Docker Build Process**:

   - Stage 1: Build the React app using Vite
   - Stage 2: Set up Express server with built React files

2. **Express Server**:

   - Serves built React app as static files
   - Handles `/api/segment` endpoint for image processing
   - Fallback route serves React app for client-side routing

3. **Security**:
   - API keys stay on the server
   - Frontend never sees sensitive credentials
   - CORS not needed (same-origin requests)

## Deployment URL

After deployment, your app will be available at:
`https://your-service-name.onrender.com`

## Troubleshooting

### Common Issues

1. **Build Failures**:

   - Check Docker build logs in Render dashboard
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **API Not Working**:

   - Confirm `VITE_REPLICATE_API_TOKEN` is set in Render dashboard
   - Check server logs for API errors
   - Verify Replicate API quota/billing

3. **Static Files Not Loading**:
   - Confirm Docker correctly copies `dist/` to `public/`
   - Check Express static file serving configuration

### Logs and Monitoring

- **Render Dashboard**: View deployment and runtime logs
- **Health Check**: `https://your-app.onrender.com/health`
- **API Endpoint**: `https://your-app.onrender.com/api/segment`

## Free Tier Limits

Render Free Tier includes:

- 750 hours/month of runtime
- Automatic sleep after 15 minutes of inactivity
- Cold start delays when waking up
- Single instance only

For production use, consider upgrading to a paid plan.

## Environment Variables Security

✅ **Secure**: API tokens stored in Render dashboard  
✅ **Open Source**: No secrets in your code repository  
✅ **Professional**: Standard deployment architecture

Your repository can be public while keeping API credentials secure!
