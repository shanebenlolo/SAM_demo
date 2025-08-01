/**
 * ToolsPanel component - handles tool selection and brush size controls
 */

import React from "react";
import type { Tool } from "../../types";
import "./ToolsPanel.css";

interface ToolsPanelProps {
  selectedTool: Tool;
  brushSize: number;
  onToolSelect: (tool: Tool) => void;
  onBrushSizeChange: (size: number) => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  selectedTool,
  brushSize,
  onToolSelect,
  onBrushSizeChange,
}) => {
  return (
    <div className="tools-panel">
      <div className="tool-group">
        <button
          className={`tool-button ${
            selectedTool === "pencil" ? "selected" : ""
          }`}
          onClick={() => onToolSelect("pencil")}
          title="Pencil Tool"
        >
          ✏️
        </button>
        <button
          className={`tool-button ${
            selectedTool === "eraser" ? "selected" : ""
          }`}
          onClick={() => onToolSelect("eraser")}
          title="Eraser Tool"
        >
          🗑️
        </button>
      </div>

      <div className="brush-controls">
        <label htmlFor="brush-size">Brush Size: {brushSize}px</label>
        <input
          id="brush-size"
          type="range"
          min="1"
          max="50"
          value={brushSize}
          onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
        />
      </div>
    </div>
  );
};
