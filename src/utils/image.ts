/**
 * Image processing utilities
 */

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

export function fileToBase64(file: File): Promise<string> {
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

export function calculateCanvasSize(
  image: HTMLImageElement,
  maxSize: number = 800
): { width: number; height: number } {
  const aspectRatio = image.width / image.height;
  let canvasWidth: number;
  let canvasHeight: number;

  if (image.width > image.height) {
    canvasWidth = Math.min(maxSize, image.width);
    canvasHeight = canvasWidth / aspectRatio;
  } else {
    canvasHeight = Math.min(maxSize, image.height);
    canvasWidth = canvasHeight * aspectRatio;
  }

  return {
    width: Math.round(canvasWidth),
    height: Math.round(canvasHeight),
  };
}
