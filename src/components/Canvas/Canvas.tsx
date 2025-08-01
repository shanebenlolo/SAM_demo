import React, { useRef, useEffect, useState, useCallback } from "react";
import { WebGPURenderer } from "../../renderer/pipeline";
import type { WebGPUCanvasProps } from "../../types";
import "./Canvas.css";

export const Canvas: React.FC<WebGPUCanvasProps> = ({
  baseImage,
  segmentLayers,
  selectedLayerId,
  selectedTool,
  brushSize,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGPURenderer | null>(null);
  const [isWebGPUSupported, setIsWebGPUSupported] = useState<boolean | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Drawing functions (define all useCallbacks first to maintain hook order)
  const getCanvasCoordinates = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  // Create composite mask from visible layers
  const createCompositeMask =
    useCallback(async (): Promise<HTMLImageElement | null> => {
      if (segmentLayers.length === 0) return null;

      const visibleLayers = segmentLayers.filter((layer) => layer.visible);
      if (visibleLayers.length === 0) return null;

      // Use the first visible layer to get dimensions
      const firstLayer = visibleLayers[0];
      const canvas = document.createElement("canvas");
      canvas.width = firstLayer.canvas.width;
      canvas.height = firstLayer.canvas.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) return null;

      // Clear canvas
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Composite visible layers in reverse order (bottom layers first, top layers last)
      // This ensures that lower-index layers (top of list) appear on top of higher-index layers
      [...visibleLayers].reverse().forEach((layer) => {
        // Get canvas data
        const layerCtx = layer.canvas.getContext("2d");
        if (!layerCtx) return;

        const imageData = layerCtx.getImageData(
          0,
          0,
          layer.canvas.width,
          layer.canvas.height
        );
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 128) {
            // Directly encode the layer's RGB color into the mask
            // This eliminates any ID encoding/decoding issues
            const [r, g, b] = layer.color;
            data[i] = r; // R
            data[i + 1] = g; // G
            data[i + 2] = b; // B
            data[i + 3] = 255; // A
          } else {
            data[i + 3] = 0; // Make transparent
          }
        }

        // Create temporary canvas for this processed layer
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;

        tempCtx.putImageData(imageData, 0, 0);

        // Composite onto main canvas - use source-over so top layers cover bottom layers
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(tempCanvas, 0, 0);
      });

      // Convert to image
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = canvas.toDataURL();
      });
    }, [segmentLayers]);

  const drawOnLayer = useCallback(
    (x: number, y: number, isErasing: boolean) => {
      if (selectedLayerId === null) return;

      const selectedLayer = segmentLayers.find(
        (layer) => layer.id === selectedLayerId
      );
      if (!selectedLayer) return;

      const ctx = selectedLayer.canvas.getContext("2d");
      if (!ctx) return;

      // Scale coordinates from display canvas to layer canvas
      const scaleX = selectedLayer.canvas.width / width;
      const scaleY = selectedLayer.canvas.height / height;
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledBrushSize = brushSize * Math.min(scaleX, scaleY);

      // Set up drawing style
      ctx.globalCompositeOperation = isErasing
        ? "destination-out"
        : "source-over";
      ctx.fillStyle = isErasing ? "rgba(0,0,0,1)" : "white";
      ctx.beginPath();
      ctx.arc(scaledX, scaledY, scaledBrushSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // If we have a previous position, draw a line to create smooth strokes
      if (lastMousePos && !isErasing) {
        const scaledLastX = lastMousePos.x * scaleX;
        const scaledLastY = lastMousePos.y * scaleY;

        ctx.lineWidth = scaledBrushSize;
        ctx.lineCap = "round";
        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.moveTo(scaledLastX, scaledLastY);
        ctx.lineTo(scaledX, scaledY);
        ctx.stroke();
      }

      // Update the renderer without full reinitialization
      if (rendererRef.current && canvasRef.current && baseImage) {
        createCompositeMask().then((compositeMask) => {
          if (rendererRef.current) {
            rendererRef.current.updateMask(compositeMask);
          }
        });
      }
    },
    [
      selectedLayerId,
      segmentLayers,
      brushSize,
      lastMousePos,
      baseImage,
      createCompositeMask,
      width,
      height,
    ]
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (selectedLayerId === null) return;

      event.preventDefault();
      const coords = getCanvasCoordinates(event);
      if (!coords) return;

      setIsDrawing(true);
      setLastMousePos(coords);
      drawOnLayer(coords.x, coords.y, selectedTool === "eraser");
    },
    [selectedLayerId, selectedTool, getCanvasCoordinates, drawOnLayer]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const coords = getCanvasCoordinates(event);
      if (!coords) return;

      if (isDrawing && selectedLayerId !== null) {
        drawOnLayer(coords.x, coords.y, selectedTool === "eraser");
        setLastMousePos(coords);
      }
    },
    [
      isDrawing,
      selectedLayerId,
      selectedTool,
      getCanvasCoordinates,
      drawOnLayer,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    setLastMousePos(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDrawing(false);
    setLastMousePos(null);
  }, []);

  const getCursorStyle = useCallback(() => {
    if (selectedLayerId === null) return "default";

    // Create a circular cursor that matches brush size
    const size = Math.min(brushSize, 50); // Cap visual size
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${
      size / 2 - 1
    }" fill="none" stroke="black" stroke-width="2"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${
      size / 2 - 3
    }" fill="none" stroke="white" stroke-width="1"/>
      </svg>
    `;
    const encodedSvg = encodeURIComponent(svg);
    return `url("data:image/svg+xml,${encodedSvg}") ${size / 2} ${
      size / 2
    }, crosshair`;
  }, [selectedLayerId, brushSize]);

  // Check WebGPU support on component mount
  useEffect(() => {
    if (!WebGPURenderer.isSupported()) {
      setIsWebGPUSupported(false);
      setError("WebGPU is not supported in this browser");
      return;
    }
    setIsWebGPUSupported(true);
  }, []);

  // Initialize and render when props change
  useEffect(() => {
    if (
      !isWebGPUSupported ||
      !canvasRef.current ||
      !baseImage ||
      segmentLayers.length === 0
    ) {
      return;
    }

    const initializeRenderer = async () => {
      try {
        // Create composite mask from layers
        const compositeMask = await createCompositeMask();

        // Cleanup previous renderer if it exists
        if (rendererRef.current) {
          rendererRef.current.destroy();
        }

        // Create new renderer
        const renderer = new WebGPURenderer();
        rendererRef.current = renderer;

        // Initialize with current canvas and images
        await renderer.initialize({
          canvas: canvasRef.current!,
          baseImage,
          maskImage: compositeMask,
        });

        setError(null);
      } catch (err) {
        console.error("WebGPU renderer error:", err);
        setError(err instanceof Error ? err.message : "Unknown WebGPU error");
      }
    };

    initializeRenderer();
  }, [isWebGPUSupported, baseImage, segmentLayers, createCompositeMask]);

  // Cleanup renderer on unmount
  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, []);

  // Render loading state
  if (isWebGPUSupported === null) {
    return (
      <div
        style={{
          width,
          height,
          border: "2px dashed #ccc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          color: "#666",
        }}
      >
        Checking WebGPU support...
      </div>
    );
  }

  // Render unsupported state
  if (isWebGPUSupported === false) {
    return (
      <div
        style={{
          width,
          height,
          border: "2px dashed #ccc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          color: "#666",
        }}
      >
        WebGPU not supported
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div
        style={{
          width,
          height,
          border: "2px solid #ff6b6b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffe0e0",
          color: "#d63031",
          padding: "20px",
          textAlign: "center",
        }}
      >
        Error: {error}
      </div>
    );
  }

  // Render canvas
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        border: "2px solid #333",
        maxWidth: "100%",
        height: "auto",
        cursor: getCursorStyle(),
      }}
    />
  );
};
