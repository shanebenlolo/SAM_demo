import React, { useState } from "react";
import { WebGPUCanvas } from "./WebGPUCanvas";
import { segmentImage, urlToImage, base64ToImage } from "./replicate";
import "./App.css";

interface AppState {
  uploadedImage: HTMLImageElement | null;
  maskImage: HTMLImageElement | null;
  isProcessing: boolean;
  error: string | null;
  canvasSize: { width: number; height: number };
}

function App() {
  const [state, setState] = useState<AppState>({
    uploadedImage: null,
    maskImage: null,
    isProcessing: false,
    error: null,
    canvasSize: { width: 800, height: 600 },
  });

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      // Convert uploaded file to HTMLImageElement
      const imageUrl = URL.createObjectURL(file);
      const uploadedImage = await urlToImage(imageUrl);

      // Calculate canvas size maintaining aspect ratio
      const maxSize = 800;
      const aspectRatio = uploadedImage.width / uploadedImage.height;
      let canvasWidth, canvasHeight;

      if (uploadedImage.width > uploadedImage.height) {
        canvasWidth = Math.min(maxSize, uploadedImage.width);
        canvasHeight = canvasWidth / aspectRatio;
      } else {
        canvasHeight = Math.min(maxSize, uploadedImage.height);
        canvasWidth = canvasHeight * aspectRatio;
      }

      setState((prev) => ({
        ...prev,
        uploadedImage,
        canvasSize: {
          width: Math.round(canvasWidth),
          height: Math.round(canvasHeight),
        },
      }));

      // Send to Replicate API for segmentation
      const maskBase64 = await segmentImage(file);
      const maskImage = await base64ToImage(maskBase64);

      setState((prev) => ({
        ...prev,
        maskImage,
        isProcessing: false,
      }));

      // Clean up object URL
      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      console.error("Error processing image:", error);

      // Check if it's an empty mask error
      if ((error as any).isEmpty) {
        // For empty masks, show the error briefly then reset
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "No segmentations detected",
          isProcessing: false,
        }));

        // Auto-reset after 3 seconds
        setTimeout(() => {
          resetApp();
        }, 3000);
      } else {
        // For other errors, just show the error
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
          isProcessing: false,
        }));
      }
    }
  };

  const resetApp = () => {
    setState({
      uploadedImage: null,
      maskImage: null,
      isProcessing: false,
      error: null,
      canvasSize: { width: 800, height: 600 },
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>WebGPU Image Segmentation Visualizer</h1>
        <p>
          Upload an image to generate a segmentation mask using Meta's SAM-2
          model
        </p>
      </header>

      <main className="app-main">
        <div className="upload-section">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={state.isProcessing}
            id="file-input"
            style={{ display: "none" }}
          />
          <label htmlFor="file-input" className="upload-button">
            {state.isProcessing ? "Processing..." : "Choose Image"}
          </label>

          {state.uploadedImage && (
            <button onClick={resetApp} className="reset-button">
              Reset
            </button>
          )}
        </div>

        {state.error && (
          <div className="error-message">
            <h3>Error:</h3>
            <p>{state.error}</p>
          </div>
        )}

        {state.isProcessing && (
          <div className="processing-message">
            <div className="spinner"></div>
            <p>Generating segmentation mask...</p>
            <p>
              <small>This may take 10-30 seconds</small>
            </p>
          </div>
        )}

        {state.uploadedImage && (
          <div className="canvas-section">
            <h2>Result:</h2>
            <p>
              {state.maskImage
                ? "Each detected object is highlighted in a different color"
                : "Generating segmentation mask..."}
            </p>
            <WebGPUCanvas
              baseImage={state.uploadedImage}
              maskImage={state.maskImage}
              width={state.canvasSize.width}
              height={state.canvasSize.height}
            />
            <div className="image-info">
              <p>
                Original size: {state.uploadedImage.width} ×{" "}
                {state.uploadedImage.height}px
              </p>
              <p>
                Display size: {state.canvasSize.width} ×{" "}
                {state.canvasSize.height}px
              </p>
            </div>
          </div>
        )}

        {!state.uploadedImage && !state.isProcessing && !state.error && (
          <div className="instructions">
            <h2>Instructions:</h2>
            <ol>
              <li>Click "Choose Image" to upload an image file</li>
              <li>
                Wait for the Replicate API to process the image with SAM-2
              </li>
              <li>View the result rendered with WebGPU</li>
            </ol>
            <p>
              <strong>Note:</strong> This demo requires a browser that supports
              WebGPU (Chrome 113+, Edge 113+, etc.)
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
