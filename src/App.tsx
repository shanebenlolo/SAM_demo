/**
 * Main App component - orchestrates the segmentation editor
 */

import React, { useState } from "react";
import type { AppState, Tool } from "./types";
import {
  Header,
  UploadSection,
  StatusMessages,
  LayersPanel,
  ToolsPanel,
  ImageInfo,
  Canvas,
  Instructions,
} from "./components";
import { segmentImage } from "./services/segmentation";
import { downloadSegments } from "./services/download";
import { urlToImage, calculateCanvasSize } from "./utils/image";
import { getVisibleLayers, reorderLayers } from "./utils/layer";
import "./App.css";

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
      const canvasSize = calculateCanvasSize(uploadedImage);

      setState((prev) => ({
        ...prev,
        uploadedImage,
        canvasSize,
      }));

      // Send to segmentation API
      const layers = await segmentImage(file);

      setState((prev) => ({
        ...prev,
        segmentLayers: layers,
        selectedLayerId: layers.length > 0 ? layers[0].id : null,
        isProcessing: false,
      }));

      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      console.error("Error processing image:", error);

      if ((error as any).isEmpty) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "No segmentations detected",
          isProcessing: false,
        }));

        setTimeout(() => {
          resetApp();
        }, 3000);
      } else {
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

  const handleDownloadSegments = async () => {
    if (!state.uploadedImage || state.segmentLayers.length === 0) return;

    try {
      setState((prev) => ({ ...prev, isDownloading: true }));
      await downloadSegments(state.segmentLayers, state.uploadedImage);
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

  const toggleLayerVisibility = (layerId: number) => {
    setState((prev) => ({
      ...prev,
      segmentLayers: prev.segmentLayers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      ),
    }));
  };

  const selectLayer = (layerId: number) => {
    setState((prev) => ({ ...prev, selectedLayerId: layerId }));
  };

  const handleToolSelect = (tool: Tool) => {
    setState((prev) => ({ ...prev, selectedTool: tool }));
  };

  const handleBrushSizeChange = (size: number) => {
    setState((prev) => ({ ...prev, brushSize: size }));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, layerId: number) => {
    e.dataTransfer.effectAllowed = "move";
    setState((prev) => ({ ...prev, draggedLayerId: layerId }));
  };

  const handleDragOver = (e: React.DragEvent, layerId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setState((prev) => ({ ...prev, dragOverLayerId: layerId }));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, dragOverLayerId: null }));
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

    const newLayers = reorderLayers(
      state.segmentLayers,
      state.draggedLayerId,
      targetLayerId
    );
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

  const visibleSegmentCount = getVisibleLayers(state.segmentLayers).length;

  return (
    <div className="app">
      <Header />

      <main className="app-main">
        <UploadSection
          onFileUpload={handleFileUpload}
          onReset={resetApp}
          isProcessing={state.isProcessing}
          hasImage={!!state.uploadedImage}
        />

        <StatusMessages
          error={state.error}
          isProcessing={state.isProcessing}
          isDownloading={state.isDownloading}
          visibleSegmentCount={visibleSegmentCount}
        />

        {state.uploadedImage && state.segmentLayers.length > 0 && (
          <div className="editor-layout">
            <div className="left-sidebar">
              <ToolsPanel
                selectedTool={state.selectedTool}
                brushSize={state.brushSize}
                onToolSelect={handleToolSelect}
                onBrushSizeChange={handleBrushSizeChange}
              />

              <LayersPanel
                layers={state.segmentLayers}
                selectedLayerId={state.selectedLayerId}
                draggedLayerId={state.draggedLayerId}
                dragOverLayerId={state.dragOverLayerId}
                isDownloading={state.isDownloading}
                onLayerSelect={selectLayer}
                onLayerVisibilityToggle={toggleLayerVisibility}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onDownloadSegments={handleDownloadSegments}
              />

              <ImageInfo
                originalWidth={state.uploadedImage.width}
                originalHeight={state.uploadedImage.height}
                displayWidth={state.canvasSize.width}
                displayHeight={state.canvasSize.height}
                layerCount={state.segmentLayers.length}
              />
            </div>

            <div className="canvas-section">
              <Canvas
                baseImage={state.uploadedImage}
                segmentLayers={state.segmentLayers}
                selectedLayerId={state.selectedLayerId}
                selectedTool={state.selectedTool}
                brushSize={state.brushSize}
                width={state.canvasSize.width}
                height={state.canvasSize.height}
              />
            </div>
          </div>
        )}

        {!state.uploadedImage && !state.isProcessing && !state.error && (
          <Instructions />
        )}
      </main>
    </div>
  );
}

export default App;
