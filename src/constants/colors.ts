/**
 * Shared color constants for segment visualization
 */

// Color palette for segments (RGB values 0-255) - 30 distinct colors
export const SEGMENT_COLOR_PALETTE: [number, number, number][] = [
  // Primary and bright colors
  [255, 51, 51], // Red
  [51, 255, 51], // Green
  [51, 102, 255], // Blue
  [255, 255, 51], // Yellow
  [255, 51, 255], // Magenta
  [51, 255, 255], // Cyan

  // Secondary bright colors
  [255, 153, 51], // Orange
  [153, 51, 255], // Purple
  [51, 255, 153], // Spring Green
  [255, 204, 51], // Gold
  [204, 51, 153], // Pink
  [102, 204, 255], // Light Blue

  // Darker saturated colors
  [204, 0, 0], // Dark Red
  [0, 153, 0], // Dark Green
  [0, 51, 204], // Dark Blue
  [204, 102, 0], // Dark Orange
  [102, 0, 204], // Dark Purple
  [0, 204, 204], // Dark Cyan

  // Pastel colors
  [255, 182, 193], // Light Pink
  [173, 216, 230], // Light Blue
  [144, 238, 144], // Light Green
  [255, 218, 185], // Peach
  [221, 160, 221], // Plum
  [255, 255, 224], // Light Yellow

  // Earth tones and unique colors
  [210, 180, 140], // Tan
  [255, 127, 80], // Coral
  [64, 224, 208], // Turquoise
  [255, 20, 147], // Deep Pink
  [50, 205, 50], // Lime Green
  [255, 105, 180], // Hot Pink

  // Additional distinct colors
  [127, 255, 212], // Aquamarine
  [240, 230, 140], // Khaki
  [218, 112, 214], // Orchid
  [175, 238, 238], // Pale Turquoise
  [255, 160, 122], // Light Salmon
  [152, 251, 152], // Pale Green
];

// WebGPU shader color palette (normalized to 0-1 range)
export const WEBGPU_COLOR_PALETTE: [number, number, number][] =
  SEGMENT_COLOR_PALETTE.map(([r, g, b]) => [r / 255, g / 255, b / 255]);
