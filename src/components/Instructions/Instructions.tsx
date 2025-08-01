/**
 * Instructions component - displays usage instructions for the app
 */

import React from "react";
import "./Instructions.css";

export const Instructions: React.FC = () => {
  return (
    <div className="instructions">
      <h2>Instructions:</h2>
      <ol>
        <li>Click "Choose Image" to upload an image file</li>
        <li>Wait for the API to process the image with SAM-2</li>
        <li>Drag layers in the left panel to reorder them</li>
        <li>Select a segment layer to edit it</li>
        <li>Use pencil to add or eraser to remove</li>
        <li>Click "📦 Download Segments" to save as ZIP</li>
      </ol>
      <p>
        <strong>Note:</strong> Requires WebGPU support (Chrome 113+, Edge 113+)
      </p>
    </div>
  );
};
