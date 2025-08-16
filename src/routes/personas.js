const express = require('express');
const {
  getPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deletePersona,
  getPersonaStats
} = require('../controllers/personaController');
const {
  validatePersona,
  validateObjectId
} = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all persona routes
router.use(authenticateToken);

/**
 * @route   GET /api/personas/stats
 * @desc    Get persona statistics for the user
 * @access  Private
 */
router.get('/stats', getPersonaStats);

/**
 * @route   GET /api/personas
 * @desc    Get all personas for the authenticated user (including predefined)
 * @access  Private
 * @query   search - Optional search term
 * @query   isPredefined - Optional filter for predefined personas (true/false)
 */
router.get('/', getPersonas);

/**
 * @route   POST /api/personas
 * @desc    Create a new persona
 * @access  Private
 */
router.post('/', validatePersona, createPersona);

/**
 * @route   GET /api/personas/:id
 * @desc    Get a single persona by ID
 * @access  Private
 */
router.get('/:id', validateObjectId, getPersona);

/**
 * @route   PUT /api/personas/:id
 * @desc    Update a persona
 * @access  Private
 */
router.put('/:id', validateObjectId, validatePersona, updatePersona);

/**
 * @route   DELETE /api/personas/:id
 * @desc    Delete a persona
 * @access  Private
 */
router.delete('/:id', validateObjectId, deletePersona);

module.exports = router;
