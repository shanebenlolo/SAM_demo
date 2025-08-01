/**
 * ImageInfo component - displays image and canvas information
 */

import React from "react";
import "./ImageInfo.css";

interface ImageInfoProps {
  originalWidth: number;
  originalHeight: number;
  displayWidth: number;
  displayHeight: number;
  layerCount: number;
}

export const ImageInfo: React.FC<ImageInfoProps> = ({
  originalWidth,
  originalHeight,
  displayWidth,
  displayHeight,
  layerCount,
}) => {
  return (
    <div className="image-info">
      <p>
        Original size: {originalWidth} × {originalHeight}px
      </p>
      <p>
        Display size: {displayWidth} × {displayHeight}px
      </p>
      <p>Layers: {layerCount}</p>
    </div>
  );
};
