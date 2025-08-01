/**
 * UploadSection component - handles file upload and reset functionality
 */

import React from "react";
import "./UploadSection.css";

interface UploadSectionProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  isProcessing: boolean;
  hasImage: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onFileUpload,
  onReset,
  isProcessing,
  hasImage,
}) => {
  return (
    <div className="upload-section">
      <input
        type="file"
        accept="image/*"
        onChange={onFileUpload}
        disabled={isProcessing}
        id="file-input"
        style={{ display: "none" }}
      />
      <label htmlFor="file-input" className="upload-button">
        {isProcessing ? "Processing..." : "Choose Image"}
      </label>

      {hasImage && (
        <button onClick={onReset} className="reset-button">
          Reset
        </button>
      )}
    </div>
  );
};
