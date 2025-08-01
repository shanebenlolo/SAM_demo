/**
 * Custom hook for handling file upload functionality
 */

import { useState } from "react";
import { segmentImage } from "../services/segmentation";
import { urlToImage, calculateCanvasSize } from "../utils/image";
import type { SegmentLayer } from "../types";

interface UseFileUploadReturn {
  isProcessing: boolean;
  error: string | null;
  handleFileUpload: (file: File) => Promise<{
    uploadedImage: HTMLImageElement;
    layers: SegmentLayer[];
    canvasSize: { width: number; height: number };
  }>;
  clearError: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);

      // Convert uploaded file to HTMLImageElement
      const imageUrl = URL.createObjectURL(file);
      const uploadedImage = await urlToImage(imageUrl);
      const canvasSize = calculateCanvasSize(uploadedImage);

      // Send to segmentation API
      const layers = await segmentImage(file);

      // Clean up object URL
      URL.revokeObjectURL(imageUrl);

      setIsProcessing(false);
      return { uploadedImage, layers, canvasSize };
    } catch (error) {
      console.error("Error processing image:", error);

      if ((error as any).isEmpty) {
        const errorMessage =
          error instanceof Error ? error.message : "No segmentations detected";
        setError(errorMessage);
        setIsProcessing(false);

        // Auto-reset after 3 seconds for empty mask errors
        setTimeout(() => {
          setError(null);
        }, 3000);
      } else {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        setError(errorMessage);
        setIsProcessing(false);
      }

      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    isProcessing,
    error,
    handleFileUpload,
    clearError,
  };
}
