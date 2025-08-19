const express = require("express");

const router = express.Router();

// Import route modules
const authRoutes = require("./auth");
const personaRoutes = require("./personas");
const campaignRoutes = require("./campaigns");
const contentRoutes = require("./content");

// API health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Marketing Campaign Generator API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
  });
});

// API documentation endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Marketing Campaign Generator API",
    version: "1.0.0",
    documentation: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        logout: "POST /api/auth/logout",
        profile: "GET /api/auth/profile",
        updateProfile: "PUT /api/auth/profile",
        refreshToken: "POST /api/auth/refresh-token",
      },
      personas: {
        getAll: "GET /api/personas",
        getOne: "GET /api/personas/:id",
        create: "POST /api/personas",
        update: "PUT /api/personas/:id",
        delete: "DELETE /api/personas/:id",
        stats: "GET /api/personas/stats",
      },
      campaigns: {
        getAll: "GET /api/campaigns",
        getOne: "GET /api/campaigns/:id",
        create: "POST /api/campaigns",
        update: "PUT /api/campaigns/:id",
        delete: "DELETE /api/campaigns/:id",
        archive: "PUT /api/campaigns/:id/archive",
        stats: "GET /api/campaigns/stats",
        dashboard: "GET /api/campaigns/dashboard",
        addContent: "POST /api/campaigns/:id/content",
      },
      content: {
        aiStatus: "GET /api/content/ai-status",
        generateEmail: "POST /api/content/generate-email",
        generateSocial: "POST /api/content/generate-social",
        generateAdCopy: "POST /api/content/generate-ad-copy",
        generateVariations: "POST /api/content/generate-variations",
        batchGenerate: "POST /api/content/batch-generate",
      },
    },
  });
});

// Mount route modules
router.use("/auth", authRoutes);
router.use("/personas", personaRoutes);
router.use("/campaigns", campaignRoutes);
router.use("/content", contentRoutes);

module.exports = router;
