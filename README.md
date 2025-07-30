# WebGPU Image Segmentation Visualizer

A TypeScript React application that uses the Replicate API to generate multi-color image segmentation masks with Meta's Segment Anything Model (SAM-2) and renders them using WebGPU with WGSL shaders.

## Features

- **Image Upload**: Upload any image file through a React interface
- **AI Segmentation**: Uses Meta's SAM-2 model via Replicate API to detect and segment all objects in images
- **Multi-Color Visualization**: Each detected object is highlighted in a different color (12-color palette)
- **WebGPU Rendering**: Renders the original image with semi-transparent colored overlays using raw WebGPU API
- **Client-Side Processing**: Browser-based canvas processing for optimal performance
- **Smart Error Handling**: Automatic detection and handling of images with no segmentations
- **Modern Tech Stack**: Built with React, TypeScript, Vite, and raw WebGPU API
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- **Browser Support**: Requires a browser that supports WebGPU:
  - Chrome 113+ (recommended)
  - Edge 113+
  - Firefox Nightly with WebGPU enabled
- **Node.js**: Version 18 or higher
- **Replicate API Token**: Required for image segmentation

## Setup Instructions

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd webgpu-segmentation
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```
   VITE_REPLICATE_API_TOKEN=your_replicate_api_token_here
   ```

4. **Start both servers (one command)**

   ```bash
   npm run dev
   ```

   This single command starts both:

   - Backend server at `http://localhost:3001`
   - Frontend server at `http://localhost:5173`

5. **Open your browser**
   Navigate to `http://localhost:5173` to use the application

## How It Works

### 1. Image Upload

- User selects an image file through the file input
- Image is converted to `HTMLImageElement` for GPU upload
- Canvas size is calculated to maintain aspect ratio

### 2. API Processing & Multi-Color Generation

- Image is sent to backend server (CORS proxy)
- Server calls Replicate's SAM-2 model endpoint
- SAM-2 returns individual segmentation masks for each detected object
- Server downloads individual masks and converts them to base64 (bypasses CORS)
- Client receives array of base64 mask images

### 3. Client-Side Canvas Processing

- Browser downloads and processes individual mask images
- Each mask is assigned a different grayscale value (1-12)
- Canvas API combines masks into single multi-color composite
- Composite mask is converted to base64 for GPU upload

### 4. WebGPU Rendering

- Original image and composite mask uploaded as GPU textures
- WGSL fragment shader samples both textures
- Shader maps grayscale values to 12 distinct colors (red, blue, yellow, etc.)
- Semi-transparent colored overlays are applied to show each segment
- Final result rendered to canvas using WebGPU

## Project Structure

```
src/
├── App.tsx              # Main React component with upload logic
├── WebGPUCanvas.tsx     # React canvas component (UI logic)
├── webgpuRenderer.ts    # WebGPU renderer class (GPU logic)
├── replicate.ts         # Replicate API integration
├── shaders.wgsl         # WGSL vertex and fragment shaders
├── App.css             # Application styling
├── vite-env.d.ts       # TypeScript declarations
└── main.tsx            # React app entry point
```

## Technical Details

### WebGPU Implementation

- Uses raw WebGPU API (not Three.js or Babylon.js)
- WGSL shaders for vertex and fragment processing
- Full-screen quad rendering technique
- Multi-color texture sampling and alpha blending
- 12-color palette mapping in fragment shader

### Shader Pipeline

```wgsl
// Vertex shader creates full-screen quad
@vertex fn vs_main() -> VertexOutput

// Fragment shader maps grayscale values to colors
fn getSegmentColor(segmentValue: f32) -> vec3<f32>

// Fragment shader blends image with multi-color overlays
@fragment fn fs_main() -> vec4<f32>
```

### API Integration & Architecture

- **Backend**: Lightweight Express server as CORS proxy
- **Replicate Integration**: Official Node.js client for SAM-2 API calls
- **CORS Bypass**: Server downloads external mask URLs, converts to base64
- **Client Processing**: Browser Canvas API for mask composition
- **Error Handling**: Smart detection of empty segmentations with auto-reset
- **File Handling**: Multi-format image upload with size limits

## Browser Compatibility

| Browser | Version   | Support         |
| ------- | --------- | --------------- |
| Chrome  | 113+      | ✅ Full         |
| Edge    | 113+      | ✅ Full         |
| Firefox | Nightly\* | ⚠️ Experimental |
| Safari  | Future    | ❌ Not yet      |

\*Requires manual WebGPU flag enablement in Firefox

## Environment Variables

| Variable                   | Description              | Required |
| -------------------------- | ------------------------ | -------- |
| `VITE_REPLICATE_API_TOKEN` | Your Replicate API token | Yes      |

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

## Troubleshooting

### WebGPU Not Supported

- Ensure you're using a compatible browser
- Check if WebGPU is enabled in browser flags
- Try Chrome Canary for latest WebGPU features

### API Errors

- Verify your Replicate API token is correct
- Check network connectivity
- Ensure image file is in supported format (JPG, PNG, etc.)

### Build Issues

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)
- Verify TypeScript configuration

## Performance Notes

- Segmentation typically takes 10-30 seconds via Replicate API
- WebGPU rendering is real-time once textures are loaded
- Larger images may require more processing time
- Canvas size is automatically optimized for performance

## License

MIT License - feel free to use this project for learning and development.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Resources

- [WebGPU Specification](https://www.w3.org/TR/webgpu/)
- [WGSL Specification](https://www.w3.org/TR/WGSL/)
- [Replicate API Docs](https://replicate.com/docs)
- [Meta SAM-2 Model](https://replicate.com/meta/sam-2)
