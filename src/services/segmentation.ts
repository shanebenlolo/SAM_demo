/**
 * Segmentation service - handles API calls and layer creation
 */

import type { SegmentLayer, SegmentationResult } from "../types";
import { base64ToImage } from "../utils/image";
import { SEGMENT_COLOR_PALETTE } from "../constants/colors";

/**
 * Send image to segmentation API
 */
async function callSegmentationAPI(
  imageFile: File
): Promise<SegmentationResult> {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch("/api/segment", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Server error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If response isn't JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  let result;
  try {
    result = await response.json();
  } catch (error) {
    console.error("Failed to parse JSON response:", error);
    console.error("Response status:", response.status);
    console.error("Response headers:", response.headers);
    throw new Error("Invalid response from server - please check API endpoint");
  }

  return result;
}

/**
 * Create segment layers from mask array
 */
async function createSegmentLayers(
  maskBase64Array: string[]
): Promise<SegmentLayer[]> {
  if (maskBase64Array.length === 0) {
    throw new Error("No individual masks to process");
  }

  // Load the first mask to get dimensions
  const firstImage = await base64ToImage(maskBase64Array[0]);
  const width = firstImage.width;
  const height = firstImage.height;

  const layers: SegmentLayer[] = [];

  // Process each mask into a separate layer
  for (let i = 0; i < maskBase64Array.length; i++) {
    try {
      const maskImage = await base64ToImage(maskBase64Array[i]);

      // Create canvas for this layer
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) continue;

      // Draw the mask as grayscale
      ctx.drawImage(maskImage, 0, 0);

      const layer: SegmentLayer = {
        id: i,
        visible: true,
        canvas: canvas,
        maskBase64: maskBase64Array[i],
        color: SEGMENT_COLOR_PALETTE[i % SEGMENT_COLOR_PALETTE.length],
        name: `Segment ${i + 1}`,
      };

      layers.push(layer);
    } catch (err) {
      console.warn(`Failed to process mask ${i}:`, err);
      continue;
    }
  }

  return layers;
}

/**
 * Main segmentation function
 */
export async function segmentImage(imageFile: File): Promise<SegmentLayer[]> {
  try {
    const result = await callSegmentationAPI(imageFile);

    if (!result.success) {
      const error = new Error(result.error || "No mask returned from API");
      (error as any).isEmpty = result.isEmpty;
      throw error;
    }

    if (!result.individualMasks || result.individualMasks.length === 0) {
      throw new Error("No individual masks returned from API");
    }

    const layers = await createSegmentLayers(result.individualMasks);
    return layers;
  } catch (error) {
    console.error("Error segmenting image:", error);
    throw error;
  }
}
