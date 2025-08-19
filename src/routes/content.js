const express = require("express");
const {
  generateEmailContent,
  generateSocialContent,
  generateAdCopy,
  generateContentVariations,
  batchGenerateContent,
  getAIStatus,
} = require("../controllers/contentController");
const { body } = require("express-validator");
const { handleValidationErrors } = require("../middleware/validation");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Apply authentication middleware to all content routes
router.use(authenticateToken);

/**
 * Content generation validation rules
 */
const validateContentGeneration = [
  body("campaignId").isMongoId().withMessage("Valid campaign ID is required"),

  body("personaId").isMongoId().withMessage("Valid persona ID is required"),

  body("customInstructions")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Custom instructions cannot exceed 1000 characters"),

  handleValidationErrors,
];

/**
 * Social content validation rules
 */
const validateSocialGeneration = [
  ...validateContentGeneration,
  body("platform")
    .isIn(["linkedin", "facebook", "twitter", "instagram", "youtube", "tiktok"])
    .withMessage("Valid platform is required"),

  handleValidationErrors,
];

/**
 * Content variations validation rules
 */
const validateVariationsGeneration = [
  ...validateContentGeneration,
  body("contentType")
    .isIn(["email", "social_post", "ad_copy"])
    .withMessage("Valid content type is required"),

  body("variations")
    .optional()
    .isInt({ min: 2, max: 5 })
    .withMessage("Variations must be between 2 and 5"),

  body("platform")
    .optional()
    .isIn(["linkedin", "facebook", "twitter", "instagram", "youtube", "tiktok"])
    .withMessage("Invalid platform specified"),

  handleValidationErrors,
];

/**
 * Batch generation validation rules
 */
const validateBatchGeneration = [
  body("campaignId").isMongoId().withMessage("Valid campaign ID is required"),

  body("personaId").isMongoId().withMessage("Valid persona ID is required"),

  body("contentTypes")
    .isArray({ min: 1 })
    .withMessage("At least one content type is required")
    .custom((types) => {
      const validTypes = ["email", "social_post", "ad_copy"];
      for (const type of types) {
        if (!validTypes.includes(type)) {
          throw new Error(`Invalid content type: ${type}`);
        }
      }
      return true;
    }),

  body("platforms")
    .isArray({ min: 1 })
    .withMessage("At least one platform is required")
    .custom((platforms) => {
      const validPlatforms = [
        "email",
        "linkedin",
        "facebook",
        "twitter",
        "instagram",
        "youtube",
        "tiktok",
      ];
      for (const platform of platforms) {
        if (!validPlatforms.includes(platform)) {
          throw new Error(`Invalid platform: ${platform}`);
        }
      }
      return true;
    }),

  body("customInstructions")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Custom instructions cannot exceed 1000 characters"),

  handleValidationErrors,
];

/**
 * @route   GET /api/content/ai-status
 * @desc    Get AI service status
 * @access  Private
 */
router.get("/ai-status", getAIStatus);

/**
 * @route   POST /api/content/generate-email
 * @desc    Generate email content for a campaign
 * @access  Private
 * @body    { campaignId, personaId, customInstructions? }
 */
router.post("/generate-email", validateContentGeneration, generateEmailContent);

/**
 * @route   POST /api/content/generate-social
 * @desc    Generate social media content for a campaign
 * @access  Private
 * @body    { campaignId, personaId, platform, customInstructions? }
 */
router.post(
  "/generate-social",
  validateSocialGeneration,
  generateSocialContent
);

/**
 * @route   POST /api/content/generate-ad-copy
 * @desc    Generate ad copy for a campaign
 * @access  Private
 * @body    { campaignId, personaId, platform?, customInstructions? }
 */
router.post("/generate-ad-copy", validateContentGeneration, generateAdCopy);

/**
 * @route   POST /api/content/generate-variations
 * @desc    Generate multiple content variations for A/B testing
 * @access  Private
 * @body    { campaignId, personaId, contentType, variations?, platform? }
 */
router.post(
  "/generate-variations",
  validateVariationsGeneration,
  generateContentVariations
);

/**
 * @route   POST /api/content/batch-generate
 * @desc    Batch generate content for multiple platforms
 * @access  Private
 * @body    { campaignId, personaId, contentTypes[], platforms[], customInstructions? }
 */
router.post("/batch-generate", validateBatchGeneration, batchGenerateContent);

module.exports = router;
