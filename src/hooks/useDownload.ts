/**
 * Custom hook for segment download functionality
 */

import { useState, useCallback } from "react";
import { downloadSegments } from "../services/download";
import type { SegmentLayer } from "../types";

interface UseDownloadReturn {
  isDownloading: boolean;
  error: string | null;
  downloadSegments: (
    layers: SegmentLayer[],
    baseImage: HTMLImageElement
  ) => Promise<void>;
  clearError: () => void;
}

export function useDownload(): UseDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadSegments = useCallback(
    async (layers: SegmentLayer[], baseImage: HTMLImageElement) => {
      if (layers.length === 0) return;

      try {
        setIsDownloading(true);
        setError(null);
        await downloadSegments(layers, baseImage);
      } catch (error) {
        console.error("Error creating segment download:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to create segment download";
        setError(errorMessage);
      } finally {
        setIsDownloading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isDownloading,
    error,
    downloadSegments: handleDownloadSegments,
    clearError,
  };
}
