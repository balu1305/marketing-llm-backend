const Persona = require('../models/Persona');

/**
 * Get all personas for the authenticated user (including predefined)
 * @route GET /api/personas
 * @access Private
 */
const getPersonas = async (req, res) => {
  try {
    const userId = req.userId;
    const { search, isPredefined } = req.query;

    let query = {
      $or: [
        { userId: userId },
        { isPredefined: true }
      ]
    };

    // Filter by predefined status if specified
    if (isPredefined !== undefined) {
      if (isPredefined === 'true') {
        query = { isPredefined: true };
      } else {
        query = { userId: userId, isPredefined: false };
      }
    }

    let personas;

    // Handle search
    if (search) {
      personas = await Persona.find({
        ...query,
        $text: { $search: search }
      })
      .sort({ score: { $meta: 'textScore' }, isPredefined: 1, createdAt: -1 })
      .populate('userId', 'firstName lastName email');
    } else {
      personas = await Persona.find(query)
        .sort({ isPredefined: 1, createdAt: -1 })
        .populate('userId', 'firstName lastName email');
    }

    res.json({
      success: true,
      count: personas.length,
      data: {
        personas
      }
    });
  } catch (error) {
    console.error('Get personas error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching personas'
    });
  }
};

/**
 * Get a single persona by ID
 * @route GET /api/personas/:id
 * @access Private
 */
const getPersona = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const persona = await Persona.findById(id).populate('userId', 'firstName lastName email');

    if (!persona) {
      return res.status(404).json({
        success: false,
        message: 'Persona not found'
      });
    }

    // Check if user can access this persona (own persona or predefined)
    if (!persona.isPredefined && persona.userId && persona.userId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this persona'
      });
    }

    res.json({
      success: true,
      data: {
        persona
      }
    });
  } catch (error) {
    console.error('Get persona error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching persona'
    });
  }
};

/**
 * Create a new persona
 * @route POST /api/personas
 * @access Private
 */
const createPersona = async (req, res) => {
  try {
    const userId = req.userId;
    const personaData = {
      ...req.body,
      userId,
      isPredefined: false // User-created personas are never predefined
    };

    const persona = new Persona(personaData);
    await persona.save();

    // Populate userId for response
    await persona.populate('userId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Persona created successfully',
      data: {
        persona
      }
    });
  } catch (error) {
    console.error('Create persona error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating persona'
    });
  }
};

/**
 * Update a persona
 * @route PUT /api/personas/:id
 * @access Private
 */
const updatePersona = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Find the persona first
    const persona = await Persona.findById(id);

    if (!persona) {
      return res.status(404).json({
        success: false,
        message: 'Persona not found'
      });
    }

    // Check if user can edit this persona
    if (!persona.canBeEditedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own personas. Predefined personas cannot be edited.'
      });
    }

    // Update the persona
    const updatedPersona = await Persona.findByIdAndUpdate(
      id,
      { ...req.body, isPredefined: false }, // Ensure it remains non-predefined
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Persona updated successfully',
      data: {
        persona: updatedPersona
      }
    });
  } catch (error) {
    console.error('Update persona error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating persona'
    });
  }
};

/**
 * Delete a persona
 * @route DELETE /api/personas/:id
 * @access Private
 */
const deletePersona = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Find the persona first
    const persona = await Persona.findById(id);

    if (!persona) {
      return res.status(404).json({
        success: false,
        message: 'Persona not found'
      });
    }

    // Check if user can delete this persona
    if (!persona.canBeEditedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own personas. Predefined personas cannot be deleted.'
      });
    }

    await Persona.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Persona deleted successfully'
    });
  } catch (error) {
    console.error('Delete persona error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting persona'
    });
  }
};

/**
 * Get persona statistics for the user
 * @route GET /api/personas/stats
 * @access Private
 */
const getPersonaStats = async (req, res) => {
  try {
    const userId = req.userId;

    const stats = await Persona.aggregate([
      {
        $match: {
          $or: [
            { userId: userId },
            { isPredefined: true }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalPersonas: { $sum: 1 },
          userPersonas: {
            $sum: {
              $cond: [{ $eq: ['$isPredefined', false] }, 1, 0]
            }
          },
          predefinedPersonas: {
            $sum: {
              $cond: [{ $eq: ['$isPredefined', true] }, 1, 0]
            }
          },
          totalChannels: {
            $addToSet: '$preferredChannels'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalPersonas: 1,
          userPersonas: 1,
          predefinedPersonas: 1,
          uniqueChannels: { $size: { $reduce: {
            input: '$totalChannels',
            initialValue: [],
            in: { $setUnion: ['$$value', '$$this'] }
          }}}
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalPersonas: 0,
      userPersonas: 0,
      predefinedPersonas: 0,
      uniqueChannels: 0
    };

    res.json({
      success: true,
      data: {
        stats: result
      }
    });
  } catch (error) {
    console.error('Get persona stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching persona statistics'
    });
  }
};

module.exports = {
  getPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deletePersona,
  getPersonaStats
};
