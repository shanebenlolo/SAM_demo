/**
 * UploadSection component - handles file upload and reset functionality
 */

import React, { useRef } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    // Clear the file input value to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onReset();
  };

  return (
    <div className="upload-section">
      <input
        ref={fileInputRef}
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
        <button onClick={handleReset} className="reset-button">
          Reset
        </button>
      )}
    </div>
  );
};
