const Campaign = require('../models/Campaign');
const Persona = require('../models/Persona');

/**
 * Get all campaigns for the authenticated user
 * @route GET /api/campaigns
 * @access Private
 */
const getCampaigns = async (req, res) => {
  try {
    const userId = req.userId;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      objective, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { 
      userId, 
      isArchived: false 
    };

    if (status) {
      query.status = status;
    }

    if (objective) {
      query.objective = objective;
    }

    // Handle search
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        {
          path: 'personaId',
          select: 'name description demographics'
        },
        {
          path: 'userId',
          select: 'firstName lastName email'
        }
      ],
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    const campaigns = await Campaign.paginate(query, options);

    res.json({
      success: true,
      data: {
        campaigns: campaigns.docs,
        pagination: {
          currentPage: campaigns.page,
          totalPages: campaigns.totalPages,
          totalDocuments: campaigns.totalDocs,
          hasNextPage: campaigns.hasNextPage,
          hasPrevPage: campaigns.hasPrevPage
        }
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching campaigns'
    });
  }
};

/**
 * Get a single campaign by ID
 * @route GET /api/campaigns/:id
 * @access Private
 */
const getCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const campaign = await Campaign.findById(id)
      .populate('personaId', 'name description demographics psychographics')
      .populate('userId', 'firstName lastName email')
      .populate('collaborators.userId', 'firstName lastName email');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user can access this campaign
    if (!campaign.isOwnedBy(userId) && !campaign.canBeEditedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this campaign'
      });
    }

    res.json({
      success: true,
      data: {
        campaign
      }
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching campaign'
    });
  }
};

/**
 * Create a new campaign
 * @route POST /api/campaigns
 * @access Private
 */
const createCampaign = async (req, res) => {
  try {
    const userId = req.userId;

    // Verify persona exists and user has access to it
    const persona = await Persona.findById(req.body.personaId);
    
    if (!persona) {
      return res.status(404).json({
        success: false,
        message: 'Persona not found'
      });
    }

    // Check if user can access this persona
    if (!persona.isPredefined && persona.userId && persona.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this persona'
      });
    }

    // Create campaign
    const campaignData = {
      ...req.body,
      userId,
      status: 'draft'
    };

    const campaign = new Campaign(campaignData);
    await campaign.save();

    // Populate fields for response
    await campaign.populate('personaId', 'name description demographics');
    await campaign.populate('userId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: {
        campaign
      }
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating campaign'
    });
  }
};

/**
 * Update a campaign
 * @route PUT /api/campaigns/:id
 * @access Private
 */
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Find the campaign first
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user can edit this campaign
    if (!campaign.canBeEditedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own campaigns or campaigns you collaborate on'
      });
    }

    // If personaId is being updated, verify access
    if (req.body.personaId && req.body.personaId !== campaign.personaId.toString()) {
      const persona = await Persona.findById(req.body.personaId);
      
      if (!persona) {
        return res.status(404).json({
          success: false,
          message: 'Persona not found'
        });
      }

      if (!persona.isPredefined && persona.userId && persona.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this persona'
        });
      }
    }

    // Update the campaign
    const updatedCampaign = await Campaign.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    .populate('personaId', 'name description demographics')
    .populate('userId', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      data: {
        campaign: updatedCampaign
      }
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating campaign'
    });
  }
};

/**
 * Delete a campaign
 * @route DELETE /api/campaigns/:id
 * @access Private
 */
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Find the campaign first
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Only owner can delete campaigns
    if (!campaign.isOwnedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own campaigns'
      });
    }

    await Campaign.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting campaign'
    });
  }
};

/**
 * Archive a campaign
 * @route PUT /api/campaigns/:id/archive
 * @access Private
 */
const archiveCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (!campaign.canBeEditedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only archive your own campaigns or campaigns you collaborate on'
      });
    }

    await campaign.archive();

    res.json({
      success: true,
      message: 'Campaign archived successfully'
    });
  } catch (error) {
    console.error('Archive campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while archiving campaign'
    });
  }
};

/**
 * Get campaign statistics for the user
 * @route GET /api/campaigns/stats
 * @access Private
 */
const getCampaignStats = async (req, res) => {
  try {
    const userId = req.userId;

    const stats = await Campaign.aggregate([
      {
        $match: { userId: userId, isArchived: false }
      },
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          activeCampaigns: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          },
          draftCampaigns: {
            $sum: {
              $cond: [{ $eq: ['$status', 'draft'] }, 1, 0]
            }
          },
          completedCampaigns: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          totalBudget: { $sum: '$budget' },
          totalSpent: { $sum: '$metrics.totalSpent' },
          totalImpressions: { $sum: '$metrics.totalImpressions' },
          totalClicks: { $sum: '$metrics.totalClicks' },
          totalConversions: { $sum: '$metrics.totalConversions' },
          avgCTR: { $avg: '$metrics.ctr' },
          avgCPC: { $avg: '$metrics.cpc' },
          avgROI: { $avg: '$metrics.roi' }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalCampaigns: 0,
      activeCampaigns: 0,
      draftCampaigns: 0,
      completedCampaigns: 0,
      totalBudget: 0,
      totalSpent: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      avgCTR: 0,
      avgCPC: 0,
      avgROI: 0
    };

    // Get campaigns by objective
    const objectiveStats = await Campaign.aggregate([
      {
        $match: { userId: userId, isArchived: false }
      },
      {
        $group: {
          _id: '$objective',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent campaign activity
    const recentCampaigns = await Campaign.find({
      userId,
      isArchived: false
    })
    .select('name status createdAt updatedAt')
    .sort({ updatedAt: -1 })
    .limit(5);

    res.json({
      success: true,
      data: {
        overview: result,
        byObjective: objectiveStats,
        recentActivity: recentCampaigns
      }
    });
  } catch (error) {
    console.error('Get campaign stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching campaign statistics'
    });
  }
};

/**
 * Add content to a campaign
 * @route POST /api/campaigns/:id/content
 * @access Private
 */
const addContentToCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (!campaign.canBeEditedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only add content to your own campaigns or campaigns you collaborate on'
      });
    }

    // Add content to campaign
    await campaign.addContent(req.body);

    res.status(201).json({
      success: true,
      message: 'Content added to campaign successfully',
      data: {
        content: campaign.content[campaign.content.length - 1]
      }
    });
  } catch (error) {
    console.error('Add content to campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while adding content to campaign'
    });
  }
};

/**
 * Get campaigns by status for dashboard
 * @route GET /api/campaigns/dashboard
 * @access Private
 */
const getDashboardCampaigns = async (req, res) => {
  try {
    const userId = req.userId;

    // Get active campaigns
    const activeCampaigns = await Campaign.findActiveCampaigns(userId);

    // Get recent campaigns
    const recentCampaigns = await Campaign.find({
      userId,
      isArchived: false
    })
    .populate('personaId', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

    // Get campaigns requiring attention (ending soon, low performance, etc.)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const attentionNeeded = await Campaign.find({
      userId,
      status: 'active',
      endDate: { $lte: nextWeek },
      isArchived: false
    })
    .populate('personaId', 'name')
    .sort({ endDate: 1 });

    res.json({
      success: true,
      data: {
        activeCampaigns,
        recentCampaigns,
        attentionNeeded
      }
    });
  } catch (error) {
    console.error('Get dashboard campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching dashboard campaigns'
    });
  }
};

module.exports = {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  archiveCampaign,
  getCampaignStats,
  addContentToCampaign,
  getDashboardCampaigns
};
