export interface SegmentLayer {
  id: number;
  visible: boolean;
  canvas: HTMLCanvasElement;
  maskBase64: string;
  color: [number, number, number];
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

export type Tool = "pencil" | "eraser";

export interface AppState {
  uploadedImage: HTMLImageElement | null;
  segmentLayers: SegmentLayer[];
  selectedLayerId: number | null;
  selectedTool: Tool;
  brushSize: number;
  isProcessing: boolean;
  isDownloading: boolean;
  error: string | null;
  canvasSize: { width: number; height: number };
  draggedLayerId: number | null;
  dragOverLayerId: number | null;
}

export interface WebGPUCanvasProps {
  baseImage: HTMLImageElement | null;
  segmentLayers: SegmentLayer[];
  selectedLayerId: number | null;
  selectedTool: Tool;
  brushSize: number;
  width: number;
  height: number;
}
