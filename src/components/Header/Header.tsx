/**
 * Header component - displays app title and description
 */

import React from "react";
import "./Header.css";

export const Header: React.FC = () => {
  return (
    <header className="app-header">
      <h1>WebGPU Interactive Segmentation Editor</h1>
      <p>
        Upload an image to generate segmentations using Meta's SAM-2 model, then
        edit them interactively
      </p>
    </header>
  );
};
