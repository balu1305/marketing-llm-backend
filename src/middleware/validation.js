const { body, param, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

/**
 * User registration validation rules
 */
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  
  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  
  handleValidationErrors
];

/**
 * User login validation rules
 */
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Persona creation/update validation rules
 */
const validatePersona = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Persona name is required')
    .isLength({ max: 100 })
    .withMessage('Persona name cannot exceed 100 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Persona description is required')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('demographics.age')
    .trim()
    .notEmpty()
    .withMessage('Age range is required'),
  
  body('demographics.income')
    .trim()
    .notEmpty()
    .withMessage('Income range is required'),
  
  body('demographics.location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),
  
  body('psychographics.values')
    .isArray({ min: 1 })
    .withMessage('At least one value is required'),
  
  body('psychographics.interests')
    .isArray({ min: 1 })
    .withMessage('At least one interest is required'),
  
  body('painPoints')
    .isArray({ min: 1 })
    .withMessage('At least one pain point is required'),
  
  body('goals')
    .isArray({ min: 1 })
    .withMessage('At least one goal is required'),
  
  body('preferredChannels')
    .isArray({ min: 1 })
    .withMessage('At least one preferred channel is required')
    .custom((channels) => {
      const validChannels = [
        'email', 'instagram', 'facebook', 'twitter', 'linkedin', 
        'tiktok', 'youtube', 'google-ads', 'sms', 'whatsapp',
        'tech-blogs', 'newspapers', 'radio', 'tv', 'podcasts'
      ];
      
      for (const channel of channels) {
        if (!validChannels.includes(channel)) {
          throw new Error(`Invalid channel: ${channel}`);
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * MongoDB ObjectId validation
 */
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

/**
 * Profile update validation rules
 */
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  
  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  
  handleValidationErrors
];

/**
 * Campaign creation/update validation rules
 */
const validateCampaign = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Campaign name is required')
    .isLength({ max: 200 })
    .withMessage('Campaign name cannot exceed 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('objective')
    .notEmpty()
    .withMessage('Campaign objective is required')
    .isIn(['awareness', 'engagement', 'conversion', 'retention', 'lead_generation'])
    .withMessage('Invalid campaign objective'),
  
  body('personaId')
    .isMongoId()
    .withMessage('Valid persona ID is required'),
  
  body('budget')
    .optional()
    .isNumeric()
    .withMessage('Budget must be a number')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Budget cannot be negative');
      }
      return true;
    }),
  
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  
  body('endDate')
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('tone')
    .optional()
    .isIn(['professional', 'casual', 'friendly', 'urgent', 'humorous', 'inspiring', 'authoritative'])
    .withMessage('Invalid tone'),
  
  body('keywords')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Keywords cannot exceed 500 characters'),
  
  body('generationSettings.contentTypes')
    .optional()
    .isArray()
    .withMessage('Content types must be an array')
    .custom((types) => {
      const validTypes = ['email', 'social_post', 'ad_copy', 'blog_post'];
      for (const type of types) {
        if (!validTypes.includes(type)) {
          throw new Error(`Invalid content type: ${type}`);
        }
      }
      return true;
    }),
  
  body('generationSettings.platforms')
    .optional()
    .isArray()
    .withMessage('Platforms must be an array')
    .custom((platforms) => {
      const validPlatforms = ['email', 'linkedin', 'facebook', 'twitter', 'instagram', 'youtube', 'tiktok'];
      for (const platform of platforms) {
        if (!validPlatforms.includes(platform)) {
          throw new Error(`Invalid platform: ${platform}`);
        }
      }
      return true;
    }),
  
  body('generationSettings.creativityLevel')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Creativity level must be between 0 and 10'),
  
  handleValidationErrors
];

/**
 * Content validation rules
 */
const validateContent = [
  body('contentType')
    .notEmpty()
    .withMessage('Content type is required')
    .isIn(['email', 'social_post', 'ad_copy', 'blog_post'])
    .withMessage('Invalid content type'),
  
  body('platform')
    .notEmpty()
    .withMessage('Platform is required')
    .isIn(['email', 'linkedin', 'facebook', 'twitter', 'instagram', 'youtube', 'tiktok'])
    .withMessage('Invalid platform'),
  
  body('contentBody')
    .trim()
    .notEmpty()
    .withMessage('Content body is required')
    .isLength({ max: 5000 })
    .withMessage('Content body cannot exceed 5000 characters'),
  
  body('subjectLine')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Subject line cannot exceed 200 characters'),
  
  body('hashtags')
    .optional()
    .isArray()
    .withMessage('Hashtags must be an array')
    .custom((hashtags) => {
      for (const hashtag of hashtags) {
        if (!hashtag.startsWith('#')) {
          throw new Error('All hashtags must start with #');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * A/B Test validation rules
 */
const validateABTest = [
  body('testName')
    .trim()
    .notEmpty()
    .withMessage('Test name is required')
    .isLength({ max: 100 })
    .withMessage('Test name cannot exceed 100 characters'),
  
  body('testType')
    .notEmpty()
    .withMessage('Test type is required')
    .isIn(['subject_line', 'content_body', 'visual', 'cta', 'send_time'])
    .withMessage('Invalid test type'),
  
  body('variantA')
    .notEmpty()
    .withMessage('Variant A is required'),
  
  body('variantB')
    .notEmpty()
    .withMessage('Variant B is required'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('End date must be in the future');
      }
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validatePersona,
  validateObjectId,
  validateProfileUpdate,
  validateCampaign,
  validateContent,
  validateABTest
};
