# SAM Demo - Image Segmentation Tool

A web application that uses Meta's SAM 2 (Segment Anything Model) to automatically segment objects in images, with interactive editing capabilities powered by WebGPU.

## Features

- **Automatic Image Segmentation** using Meta's SAM 2 via Replicate API
- **Interactive Editing** with pencil and eraser tools
- **Layer Management** with drag-and-drop reordering
- **WebGPU Rendering** for high-performance visualization
- **Segment Download** as individual PNG files in ZIP format

## Quick Start

### Development Mode

```bash
# Install dependencies
npm install

# Start the development server (frontend + backend)
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

### Production Deployment

This project is configured for **Docker + Render deployment** to keep API keys secure while maintaining open source code.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js API server
- **Rendering**: WebGPU for high-performance image processing
- **Deployment**: Single Docker container on Render
- **Security**: API keys secured on server, never exposed to users

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_REPLICATE_API_TOKEN=your_replicate_api_token_here
```

Get your API token from [Replicate](https://replicate.com).

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express.js
- **Rendering**: WebGPU, WGSL shaders
- **API**: Replicate (Meta SAM 2)
- **Deployment**: Docker, Render
- **Styling**: CSS3 with custom properties

## Security & Open Source

✅ **Open Source Friendly**: API credentials never exposed in frontend code  
✅ **Secure Deployment**: Environment variables managed by hosting platform  
✅ **Professional Architecture**: Standard full-stack deployment pattern

Your repository can be public while keeping API credentials completely secure!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Deployment Status

🚀 **Ready for Production**: Configured for secure Docker deployment on Render  
🔒 **Security First**: No API keys in source code  
🌐 **Open Source**: Safe to make repository public
