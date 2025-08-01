/**
 * LayersPanel component - handles layer management and download functionality
 */

import React from "react";
import type { SegmentLayer } from "../../types";
import { getVisibleLayers } from "../../utils/layer";
import "./LayersPanel.css";

interface LayersPanelProps {
  layers: SegmentLayer[];
  selectedLayerId: number | null;
  draggedLayerId: number | null;
  dragOverLayerId: number | null;
  isDownloading: boolean;
  onLayerSelect: (layerId: number) => void;
  onLayerVisibilityToggle: (layerId: number) => void;
  onDragStart: (e: React.DragEvent, layerId: number) => void;
  onDragOver: (e: React.DragEvent, layerId: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, layerId: number) => void;
  onDragEnd: () => void;
  onDownloadSegments: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  selectedLayerId,
  draggedLayerId,
  dragOverLayerId,
  isDownloading,
  onLayerSelect,
  onLayerVisibilityToggle,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onDownloadSegments,
}) => {
  const visibleLayers = getVisibleLayers(layers);

  return (
    <div className="layers-panel">
      <div className="layers-list">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className={`layer-item ${
              selectedLayerId === layer.id ? "selected" : ""
            } ${draggedLayerId === layer.id ? "dragging" : ""} ${
              dragOverLayerId === layer.id ? "drag-over" : ""
            }`}
            onClick={() => onLayerSelect(layer.id)}
            draggable
            onDragStart={(e) => onDragStart(e, layer.id)}
            onDragOver={(e) => onDragOver(e, layer.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, layer.id)}
            onDragEnd={onDragEnd}
          >
            <span className="layer-order">{index + 1}</span>
            <div className="drag-handle">⋮⋮</div>
            <button
              className="layer-visibility"
              onClick={(e) => {
                e.stopPropagation();
                onLayerVisibilityToggle(layer.id);
              }}
            >
              {layer.visible ? "👁️" : "👁️‍🗨️"}
            </button>
            <div
              className="layer-color"
              style={{
                backgroundColor: `rgb(${layer.color.join(", ")})`,
              }}
            />
            <span className="layer-name">{layer.name}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onDownloadSegments}
        disabled={isDownloading || visibleLayers.length === 0}
        className="download-button"
        title="Download visible segments as ZIP"
      >
        {isDownloading ? "Creating ZIP..." : "Download Segments"}
      </button>
    </div>
  );
};
