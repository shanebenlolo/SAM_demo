/**
 * Download service - handles segment image creation and ZIP downloads
 */

import JSZip from "jszip";
import type { SegmentLayer } from "../types";

/**
 * Create a segment image with transparent background using current edited state
 */
async function createSegmentImage(
  layer: SegmentLayer,
  baseImage: HTMLImageElement
): Promise<Blob> {
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
}

/**
 * Download segments as ZIP file
 */
export async function downloadSegments(
  segmentLayers: SegmentLayer[],
  baseImage: HTMLImageElement
): Promise<void> {
  const zip = new JSZip();

  // Process each visible segment
  for (const layer of segmentLayers) {
    if (layer.visible) {
      try {
        const segmentBlob = await createSegmentImage(layer, baseImage);
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
}
