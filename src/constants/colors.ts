/**
 * Shared color constants for segment visualization
 */

// Color palette for segments (RGB values 0-255)
export const SEGMENT_COLOR_PALETTE: [number, number, number][] = [
  [51, 255, 51], // Green
  [255, 51, 51], // Red
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

// WebGPU shader color palette (normalized to 0-1 range)
export const WEBGPU_COLOR_PALETTE: [number, number, number][] =
  SEGMENT_COLOR_PALETTE.map(([r, g, b]) => [r / 255, g / 255, b / 255]);
