/**
 * Layer utilities for color calculations and operations
 */

import type { SegmentLayer } from "../types";
import { SEGMENT_COLOR_PALETTE } from "../constants/colors";

/**
 * Get the rendered color for a layer based on its ID
 * This matches the color calculation used in WebGPU shader
 */
export function getLayerRenderColor(layerId: number): [number, number, number] {
  // Calculate segment value using the same formula as WebGPUCanvas
  const segmentValue = Math.floor((((layerId + 1) * 37) % 255) + 1);

  // Map segment value to color index using the same logic as the shader
  const segmentIndex = Math.floor(
    (segmentValue / 255) * SEGMENT_COLOR_PALETTE.length
  );

  return SEGMENT_COLOR_PALETTE[segmentIndex] || SEGMENT_COLOR_PALETTE[0];
}

/**
 * Get visible layers from segment layers array
 */
export function getVisibleLayers(layers: SegmentLayer[]): SegmentLayer[] {
  return layers.filter((layer) => layer.visible);
}

/**
 * Find layer by ID
 */
export function findLayerById(
  layers: SegmentLayer[],
  id: number
): SegmentLayer | undefined {
  return layers.find((layer) => layer.id === id);
}

/**
 * Reorder layers by moving one layer to a new position
 */
export function reorderLayers(
  layers: SegmentLayer[],
  draggedId: number,
  targetId: number
): SegmentLayer[] {
  const draggedIndex = layers.findIndex((layer) => layer.id === draggedId);
  const targetIndex = layers.findIndex((layer) => layer.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1) {
    return layers;
  }

  const newLayers = [...layers];
  const [draggedLayer] = newLayers.splice(draggedIndex, 1);
  newLayers.splice(targetIndex, 0, draggedLayer);

  return newLayers;
}
