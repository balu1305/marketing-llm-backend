const express = require('express');
const {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  archiveCampaign,
  getCampaignStats,
  addContentToCampaign,
  getDashboardCampaigns
} = require('../controllers/campaignController');
const {
  validateCampaign,
  validateContent,
  validateObjectId
} = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all campaign routes
router.use(authenticateToken);

/**
 * @route   GET /api/campaigns/stats
 * @desc    Get campaign statistics for the user
 * @access  Private
 */
router.get('/stats', getCampaignStats);

/**
 * @route   GET /api/campaigns/dashboard
 * @desc    Get campaigns for dashboard view
 * @access  Private
 */
router.get('/dashboard', getDashboardCampaigns);

/**
 * @route   GET /api/campaigns
 * @desc    Get all campaigns for the authenticated user
 * @access  Private
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10)
 * @query   status - Filter by campaign status
 * @query   objective - Filter by campaign objective
 * @query   search - Search in name, description, keywords
 * @query   sortBy - Sort field (default: createdAt)
 * @query   sortOrder - Sort order (asc/desc, default: desc)
 */
router.get('/', getCampaigns);

/**
 * @route   POST /api/campaigns
 * @desc    Create a new campaign
 * @access  Private
 */
router.post('/', validateCampaign, createCampaign);

/**
 * @route   GET /api/campaigns/:id
 * @desc    Get a single campaign by ID
 * @access  Private
 */
router.get('/:id', validateObjectId, getCampaign);

/**
 * @route   PUT /api/campaigns/:id
 * @desc    Update a campaign
 * @access  Private
 */
router.put('/:id', validateObjectId, validateCampaign, updateCampaign);

/**
 * @route   DELETE /api/campaigns/:id
 * @desc    Delete a campaign
 * @access  Private
 */
router.delete('/:id', validateObjectId, deleteCampaign);

/**
 * @route   PUT /api/campaigns/:id/archive
 * @desc    Archive a campaign
 * @access  Private
 */
router.put('/:id/archive', validateObjectId, archiveCampaign);

/**
 * @route   POST /api/campaigns/:id/content
 * @desc    Add content to a campaign
 * @access  Private
 */
router.post('/:id/content', validateObjectId, validateContent, addContentToCampaign);

module.exports = router;
