/**
 * StatusMessages component - displays error, processing, and downloading messages
 */

import React from "react";
import "./StatusMessages.css";

interface StatusMessagesProps {
  error: string | null;
  isProcessing: boolean;
  isDownloading: boolean;
  visibleSegmentCount: number;
}

export const StatusMessages: React.FC<StatusMessagesProps> = ({
  error,
  isProcessing,
  isDownloading,
  visibleSegmentCount,
}) => {
  return (
    <>
      {error && (
        <div className="error-message">
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {isProcessing && (
        <div className="processing-message">
          <div className="spinner"></div>
          <p>Generating segmentation layers...</p>
          <p>
            <small>This may take 10-30 seconds</small>
          </p>
        </div>
      )}

      {isDownloading && (
        <div className="processing-message">
          <div className="spinner"></div>
          <p>Creating segment images...</p>
          <p>
            <small>Processing {visibleSegmentCount} segments</small>
          </p>
        </div>
      )}
    </>
  );
};
