export interface SegmentationResult {
  success: boolean;
  individualMasks?: string[];
  totalMasks?: number;
  error?: string;
  message?: string;
  isEmpty?: boolean;
}

export async function segmentImage(imageFile: File): Promise<string> {
  try {
    // Create FormData to send the file
    const formData = new FormData();
    formData.append("image", imageFile);

    // Call our backend API
    const response = await fetch("http://localhost:3001/api/segment", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result: SegmentationResult = await response.json();

    if (!result.success) {
      const error = new Error(result.error || "No mask returned from API");
      (error as any).isEmpty = result.isEmpty;
      throw error;
    }

    if (!result.individualMasks || result.individualMasks.length === 0) {
      throw new Error("No individual masks returned from API");
    }

    // Process individual masks client-side to create multi-color composite
    const compositeMask = await createMultiColorComposite(
      result.individualMasks
    );
    return compositeMask;
  } catch (error) {
    console.error("Error segmenting image:", error);
    throw error;
  }
}

// Client-side function to create multi-color segmentation from individual masks
async function createMultiColorComposite(
  maskBase64Array: string[]
): Promise<string> {
  if (maskBase64Array.length === 0) {
    throw new Error("No individual masks to process");
  }

  // Load the first mask to get dimensions
  const firstImage = await base64ToImage(maskBase64Array[0]);
  const width = firstImage.width;
  const height = firstImage.height;

  // Create canvas for combining masks
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get 2D context");
  }

  // Clear canvas (black background)
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  // Process each mask and assign different grayscale values
  for (let i = 0; i < maskBase64Array.length; i++) {
    try {
      const maskImage = await base64ToImage(maskBase64Array[i]);

      // Create temporary canvas for this mask
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext("2d");

      if (!tempCtx) continue;

      // Draw the mask
      tempCtx.drawImage(maskImage, 0, 0);

      // Get image data
      const imageData = tempCtx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Assign each segment a different grayscale value (0-255)
      const segmentValue = Math.floor((i + 1) * (255 / maskBase64Array.length));

      for (let j = 0; j < data.length; j += 4) {
        // If this pixel is white in the mask (segment exists)
        if (data[j] > 128) {
          data[j] = segmentValue; // R
          data[j + 1] = segmentValue; // G
          data[j + 2] = segmentValue; // B
          data[j + 3] = 255; // A
        } else {
          // Make transparent
          data[j + 3] = 0;
        }
      }

      tempCtx.putImageData(imageData, 0, 0);

      // Composite onto main canvas with 'lighter' blend mode
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(tempCanvas, 0, 0);
    } catch (err) {
      console.warn(`Failed to process mask ${i}:`, err);
      continue;
    }
  }

  // Convert final canvas to base64
  return canvas.toDataURL("image/png");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function urlToImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export function base64ToImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64;
  });
}
