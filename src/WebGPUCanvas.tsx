import React, { useRef, useEffect, useState } from "react";
import { WebGPURenderer } from "./webgpuRenderer";

interface WebGPUCanvasProps {
  baseImage: HTMLImageElement | null;
  maskImage: HTMLImageElement | null;
  width: number;
  height: number;
}

export const WebGPUCanvas: React.FC<WebGPUCanvasProps> = ({
  baseImage,
  maskImage,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGPURenderer | null>(null);
  const [isWebGPUSupported, setIsWebGPUSupported] = useState<boolean | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

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
    if (!isWebGPUSupported || !canvasRef.current || !baseImage) {
      return;
    }

    const initializeRenderer = async () => {
      try {
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
          maskImage,
        });

        setError(null);
      } catch (err) {
        console.error("WebGPU renderer error:", err);
        setError(err instanceof Error ? err.message : "Unknown WebGPU error");
      }
    };

    initializeRenderer();
  }, [isWebGPUSupported, baseImage, maskImage]);

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
      style={{
        border: "2px solid #333",
        maxWidth: "100%",
        height: "auto",
      }}
    />
  );
};
