import express from "express";
import cors from "cors";
import multer from "multer";
import Replicate from "replicate";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const port = 3001;

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.VITE_REPLICATE_API_TOKEN,
});

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173", // Frontend will always be on port 5173 now
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Image segmentation endpoint
app.post("/api/segment", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Convert buffer to base64 data URL
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
      "base64"
    )}`;

    const input = {
      image: base64,
    };

    // Call Replicate API
    const output = await replicate.run(
      "meta/sam-2:fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83",
      { input }
    );

    if (!output.individual_masks || !Array.isArray(output.individual_masks)) {
      return res.json({
        success: false,
        error:
          "No segmentations were detected in this image. Please try a different image with clear objects.",
        isEmpty: true,
      });
    }

    // Download individual masks and convert to base64 for client-side processing
    const base64Masks = [];
    const masksToProcess = output.individual_masks.slice(0, 12); // Limit to 12 masks

    for (let i = 0; i < masksToProcess.length; i++) {
      try {
        const maskResponse = await fetch(masksToProcess[i]);
        if (maskResponse.ok) {
          const maskBuffer = await maskResponse.arrayBuffer();
          const maskBase64 = `data:image/png;base64,${Buffer.from(
            maskBuffer
          ).toString("base64")}`;
          base64Masks.push(maskBase64);
        }
      } catch (err) {
        console.warn(`Failed to download mask ${i}:`, err);
        continue;
      }
    }

    res.json({
      success: true,
      individualMasks: base64Masks,
      totalMasks: base64Masks.length,
    });
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({
      error: "Failed to process image",
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size is 10MB." });
    }
  }

  if (error.message === "Only image files are allowed!") {
    return res.status(400).json({ error: "Only image files are allowed!" });
  }

  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Backend server running at http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🤖 API endpoint: http://localhost:${port}/api/segment`);

  // Check if API token is configured
  if (!process.env.VITE_REPLICATE_API_TOKEN) {
    console.warn(
      "⚠️  WARNING: VITE_REPLICATE_API_TOKEN not found in environment variables"
    );
  } else {
    console.log("✅ Replicate API token loaded successfully");
  }
});
