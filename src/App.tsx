import React, { useState } from "react";
import { WebGPUCanvas } from "./WebGPUCanvas";
import { segmentImage, urlToImage, base64ToImage } from "./replicate";
import type { SegmentLayer } from "./replicate";
import JSZip from "jszip";
import "./App.css";

// Function to get the actual rendered color for a layer based on its ID
// This matches the color calculation used in WebGPUCanvas and the shader
function getLayerRenderColor(layerId: number): [number, number, number] {
  // Calculate segment value using the same formula as WebGPUCanvas
  const segmentValue = Math.floor((((layerId + 1) * 37) % 255) + 1);

  // Map segment value to color index using the same logic as the shader
  const segmentIndex = Math.floor((segmentValue / 255) * 12);

  // Color palette from the shader (converted from 0-1 to 0-255 range)
  const colors: [number, number, number][] = [
    [255, 51, 51], // Red
    [51, 255, 51], // Green
    [51, 102, 255], // Blue
    [255, 255, 51], // Yellow
    [255, 51, 255], // Magenta
    [51, 255, 255], // Cyan
    [255, 153, 51], // Orange
    [153, 51, 255], // Purple
    [51, 255, 153], // Spring Green
    [255, 204, 51], // Gold
    [204, 51, 153], // Pink
    [102, 204, 255], // Light Blue
  ];

  return colors[segmentIndex] || colors[0];
}

type Tool = "pencil" | "eraser";

interface AppState {
  uploadedImage: HTMLImageElement | null;
  segmentLayers: SegmentLayer[];
  selectedLayerId: number | null;
  selectedTool: Tool;
  brushSize: number;
  isProcessing: boolean;
  isDownloading: boolean;
  error: string | null;
  canvasSize: { width: number; height: number };
  draggedLayerId: number | null;
  dragOverLayerId: number | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    uploadedImage: null,
    segmentLayers: [],
    selectedLayerId: null,
    selectedTool: "pencil",
    brushSize: 10,
    isProcessing: false,
    isDownloading: false,
    error: null,
    canvasSize: { width: 800, height: 600 },
    draggedLayerId: null,
    dragOverLayerId: null,
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
      const layers = await segmentImage(file);

      setState((prev) => ({
        ...prev,
        segmentLayers: layers,
        selectedLayerId: layers.length > 0 ? layers[0].id : null,
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
      segmentLayers: [],
      selectedLayerId: null,
      selectedTool: "pencil",
      brushSize: 10,
      isProcessing: false,
      isDownloading: false,
      error: null,
      canvasSize: { width: 800, height: 600 },
      draggedLayerId: null,
      dragOverLayerId: null,
    });
  };

  const toggleLayerVisibility = (layerId: number) => {
    setState((prev) => ({
      ...prev,
      segmentLayers: prev.segmentLayers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      ),
    }));
  };

  const selectLayer = (layerId: number) => {
    setState((prev) => ({
      ...prev,
      selectedLayerId: layerId,
    }));
  };

  const selectTool = (tool: Tool) => {
    setState((prev) => ({
      ...prev,
      selectedTool: tool,
    }));
  };

  const setBrushSize = (size: number) => {
    setState((prev) => ({
      ...prev,
      brushSize: size,
    }));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, layerId: number) => {
    e.dataTransfer.effectAllowed = "move";
    setState((prev) => ({
      ...prev,
      draggedLayerId: layerId,
    }));
  };

  const handleDragOver = (e: React.DragEvent, layerId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setState((prev) => ({
      ...prev,
      dragOverLayerId: layerId,
    }));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setState((prev) => ({
      ...prev,
      dragOverLayerId: null,
    }));
  };

  const handleDrop = (e: React.DragEvent, targetLayerId: number) => {
    e.preventDefault();

    if (
      state.draggedLayerId === null ||
      state.draggedLayerId === targetLayerId
    ) {
      setState((prev) => ({
        ...prev,
        draggedLayerId: null,
        dragOverLayerId: null,
      }));
      return;
    }

    const draggedIndex = state.segmentLayers.findIndex(
      (layer) => layer.id === state.draggedLayerId
    );
    const targetIndex = state.segmentLayers.findIndex(
      (layer) => layer.id === targetLayerId
    );

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create new array with reordered layers
    const newLayers = [...state.segmentLayers];
    const [draggedLayer] = newLayers.splice(draggedIndex, 1);
    newLayers.splice(targetIndex, 0, draggedLayer);

    setState((prev) => ({
      ...prev,
      segmentLayers: newLayers,
      draggedLayerId: null,
      dragOverLayerId: null,
    }));
  };

  const handleDragEnd = () => {
    setState((prev) => ({
      ...prev,
      draggedLayerId: null,
      dragOverLayerId: null,
    }));
  };

  // Function to create a segment image with transparent background using current edited state
  const createSegmentImage = async (
    layer: SegmentLayer,
    baseImage: HTMLImageElement
  ): Promise<Blob> => {
    // Create a canvas for the segment
    const canvas = document.createElement("canvas");
    canvas.width = baseImage.width;
    canvas.height = baseImage.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Draw the base image
    ctx.drawImage(baseImage, 0, 0);

    // Get the image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Use the current edited layer canvas instead of the original maskBase64
    const layerCanvas = layer.canvas;
    const layerCtx = layerCanvas.getContext("2d");

    if (!layerCtx) {
      throw new Error("Failed to get layer canvas context");
    }

    // Get the current edited mask data from the layer canvas
    const maskData = layerCtx.getImageData(
      0,
      0,
      layerCanvas.width,
      layerCanvas.height
    );
    const maskPixels = maskData.data;

    // Calculate scale factors if dimensions don't match
    const scaleX = layerCanvas.width / canvas.width;
    const scaleY = layerCanvas.height / canvas.height;

    // Apply the mask - set pixels to transparent where mask is black
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const pixelIndex = (y * canvas.width + x) * 4;

        // Get corresponding mask pixel coordinates
        const maskX = Math.floor(x * scaleX);
        const maskY = Math.floor(y * scaleY);
        const maskIndex = (maskY * layerCanvas.width + maskX) * 4;

        // Check if mask pixel is black (segment not included)
        // The layer canvas uses white pixels for the segment, black for non-segment
        const maskValue = maskPixels[maskIndex]; // Red channel

        if (maskValue < 128) {
          // If mask is dark (not part of segment)
          data[pixelIndex + 3] = 0; // Set alpha to 0 (transparent)
        }
      }
    }

    // Put the modified image data back
    ctx.putImageData(imageData, 0, 0);

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob"));
        }
      }, "image/png");
    });
  };

  // Function to download all segments as a zip
  const downloadSegments = async () => {
    if (!state.uploadedImage || state.segmentLayers.length === 0) return;

    try {
      setState((prev) => ({ ...prev, isDownloading: true }));

      const zip = new JSZip();

      // Process each visible segment
      for (const layer of state.segmentLayers) {
        if (layer.visible) {
          try {
            const segmentBlob = await createSegmentImage(
              layer,
              state.uploadedImage
            );
            zip.file(`${layer.name}.png`, segmentBlob);
          } catch (error) {
            console.warn(`Failed to process ${layer.name}:`, error);
          }
        }
      }

      // Generate and download the zip
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "segments.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error creating segment download:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to create segment download",
      }));
    } finally {
      setState((prev) => ({ ...prev, isDownloading: false }));
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>WebGPU Interactive Segmentation Editor</h1>
        <p>
          Upload an image to generate segmentations using Meta's SAM-2 model,
          then edit them interactively
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
            <p>Generating segmentation layers...</p>
            <p>
              <small>This may take 10-30 seconds</small>
            </p>
          </div>
        )}

        {state.isDownloading && (
          <div className="processing-message">
            <div className="spinner"></div>
            <p>Creating segment images...</p>
            <p>
              <small>
                Processing {state.segmentLayers.filter((l) => l.visible).length}{" "}
                segments
              </small>
            </p>
          </div>
        )}

        {state.uploadedImage && state.segmentLayers.length > 0 && (
          <div className="editor-layout">
            {/* Left Sidebar - Layers Panel */}
            <div className="layers-panel">
              <h3>Layers</h3>
              <p className="layers-hint">
                Drag layers to reorder (top covers bottom)
              </p>
              <div className="layers-list">
                {state.segmentLayers.map((layer, index) => (
                  <div
                    key={layer.id}
                    className={`layer-item ${
                      state.selectedLayerId === layer.id ? "selected" : ""
                    } ${state.draggedLayerId === layer.id ? "dragging" : ""} ${
                      state.dragOverLayerId === layer.id ? "drag-over" : ""
                    }`}
                    onClick={() => selectLayer(layer.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, layer.id)}
                    onDragOver={(e) => handleDragOver(e, layer.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, layer.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <span className="layer-order">{index + 1}</span>
                    <div className="drag-handle">⋮⋮</div>
                    <button
                      className="layer-visibility"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerVisibility(layer.id);
                      }}
                    >
                      {layer.visible ? "👁️" : "👁️‍🗨️"}
                    </button>
                    <div
                      className="layer-color"
                      style={{
                        backgroundColor: `rgb(${getLayerRenderColor(
                          layer.id
                        ).join(", ")})`,
                      }}
                    />
                    <span className="layer-name">{layer.name}</span>
                  </div>
                ))}
              </div>

              {/* Download Button */}
              <button
                onClick={downloadSegments}
                disabled={
                  state.isDownloading ||
                  state.segmentLayers.filter((l) => l.visible).length === 0
                }
                className="download-button"
                title="Download visible segments as ZIP"
              >
                {state.isDownloading
                  ? "Creating ZIP..."
                  : "📦 Download Segments"}
              </button>
            </div>

            {/* Main Content Area */}
            <div className="main-editor">
              {/* Top Toolbar */}
              <div className="tools-panel">
                <div className="tool-group">
                  <button
                    className={`tool-button ${
                      state.selectedTool === "pencil" ? "selected" : ""
                    }`}
                    onClick={() => selectTool("pencil")}
                    title="Pencil Tool"
                  >
                    ✏️
                  </button>
                  <button
                    className={`tool-button ${
                      state.selectedTool === "eraser" ? "selected" : ""
                    }`}
                    onClick={() => selectTool("eraser")}
                    title="Eraser Tool"
                  >
                    🗑️
                  </button>
                </div>

                <div className="brush-controls">
                  <label htmlFor="brush-size">
                    Brush Size: {state.brushSize}px
                  </label>
                  <input
                    id="brush-size"
                    type="range"
                    min="1"
                    max="50"
                    value={state.brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Canvas Area */}
              <div className="canvas-section">
                <WebGPUCanvas
                  baseImage={state.uploadedImage}
                  segmentLayers={state.segmentLayers}
                  selectedLayerId={state.selectedLayerId}
                  selectedTool={state.selectedTool}
                  brushSize={state.brushSize}
                  width={state.canvasSize.width}
                  height={state.canvasSize.height}
                />
              </div>

              {/* Info Panel */}
              <div className="image-info">
                <p>
                  Original size: {state.uploadedImage.width} ×{" "}
                  {state.uploadedImage.height}px
                </p>
                <p>
                  Display size: {state.canvasSize.width} ×{" "}
                  {state.canvasSize.height}px
                </p>
                <p>Layers: {state.segmentLayers.length}</p>
              </div>
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
              <li>Drag layers in the left panel to reorder them</li>
              <li>Select a segment layer to edit it</li>
              <li>Choose pencil ✏️ to add or eraser 🗑️ to remove</li>
              <li>Adjust brush size and start editing!</li>
              <li>
                Click "📦 Download Segments" to save visible layers as PNG files
                in a ZIP
              </li>
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
