export interface SegmentLayer {
  id: number;
  visible: boolean;
  canvas: HTMLCanvasElement;
  maskBase64: string;
  color: [number, number, number]; // RGB color for this segment
  name: string;
}

export interface SegmentationResult {
  success: boolean;
  individualMasks?: string[];
  totalMasks?: number;
  error?: string;
  message?: string;
  isEmpty?: boolean;
}

export async function segmentImage(imageFile: File): Promise<SegmentLayer[]> {
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

    // Process individual masks into separate layers
    const layers = await createSegmentLayers(result.individualMasks);
    return layers;
  } catch (error) {
    console.error("Error segmenting image:", error);
    throw error;
  }
}

// Create individual segment layers from mask array
async function createSegmentLayers(
  maskBase64Array: string[]
): Promise<SegmentLayer[]> {
  if (maskBase64Array.length === 0) {
    throw new Error("No individual masks to process");
  }

  // Color palette for segments
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
        color: colors[i % colors.length],
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
