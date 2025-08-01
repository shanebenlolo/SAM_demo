/**
 * Custom hook for managing layer operations
 */

import { useCallback } from "react";
import { reorderLayers, getVisibleLayers } from "../utils/layer";
import type { SegmentLayer } from "../types";

interface UseLayerManagementProps {
  layers: SegmentLayer[];
  onLayersUpdate: (layers: SegmentLayer[]) => void;
  onLayerSelect: (layerId: number) => void;
}

interface UseLayerManagementReturn {
  visibleLayerCount: number;
  toggleLayerVisibility: (layerId: number) => void;
  selectLayer: (layerId: number) => void;
  reorderLayer: (draggedId: number, targetId: number) => void;
}

export function useLayerManagement({
  layers,
  onLayersUpdate,
  onLayerSelect,
}: UseLayerManagementProps): UseLayerManagementReturn {
  const visibleLayerCount = getVisibleLayers(layers).length;

  const toggleLayerVisibility = useCallback(
    (layerId: number) => {
      const updatedLayers = layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      );
      onLayersUpdate(updatedLayers);
    },
    [layers, onLayersUpdate]
  );

  const selectLayer = useCallback(
    (layerId: number) => {
      onLayerSelect(layerId);
    },
    [onLayerSelect]
  );

  const reorderLayer = useCallback(
    (draggedId: number, targetId: number) => {
      if (draggedId === targetId) return;

      const reorderedLayers = reorderLayers(layers, draggedId, targetId);
      onLayersUpdate(reorderedLayers);
    },
    [layers, onLayersUpdate]
  );

  return {
    visibleLayerCount,
    toggleLayerVisibility,
    selectLayer,
    reorderLayer,
  };
}
