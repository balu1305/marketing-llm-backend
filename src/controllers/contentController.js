const Campaign = require('../models/Campaign');
const Persona = require('../models/Persona');
const AIContentGenerator = require('../services/aiService');

// Initialize AI service
const aiService = new AIContentGenerator();

/**
 * Generate email content for a campaign
 * @route POST /api/content/generate-email
 * @access Private
 */
const generateEmailContent = async (req, res) => {
  try {
    const { campaignId, personaId, customInstructions } = req.body;
    const userId = req.userId;

    // Validate AI service availability
    if (!aiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI content generation service is not available. Please configure OpenAI API key.'
      });
    }

    // Get campaign and persona data
    const [campaign, persona] = await Promise.all([
      Campaign.findById(campaignId),
      Persona.findById(personaId)
    ]);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (!persona) {
      return res.status(404).json({
        success: false,
        message: 'Persona not found'
      });
    }

    // Check access permissions
    if (!campaign.canBeEditedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this campaign'
      });
    }

    if (!persona.isPredefined && persona.userId && !persona.isOwnedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this persona'
      });
    }

    // Add custom instructions to campaign context if provided
    if (customInstructions) {
      campaign.generationSettings = campaign.generationSettings || {};
      campaign.generationSettings.customInstructions = customInstructions;
    }

    // Generate email content
    const emailContent = await aiService.generateEmailContent(persona, campaign);

    // Add content to campaign
    await campaign.addContent(emailContent);

    res.json({
      success: true,
      message: 'Email content generated successfully',
      data: {
        content: emailContent
      }
    });

  } catch (error) {
    console.error('Generate email content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating email content'
    });
  }
};

/**
 * Generate social media content for a campaign
 * @route POST /api/content/generate-social
 * @access Private
 */
const generateSocialContent = async (req, res) => {
  try {
    const { campaignId, personaId, platform, customInstructions } = req.body;
    const userId = req.userId;

    // Validate AI service availability
    if (!aiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI content generation service is not available. Please configure OpenAI API key.'
      });
    }

    // Validate platform
    const validPlatforms = ['linkedin', 'facebook', 'twitter', 'instagram', 'youtube', 'tiktok'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform specified'
      });
    }

    // Get campaign and persona data
    const [campaign, persona] = await Promise.all([
      Campaign.findById(campaignId),
      Persona.findById(personaId)
    ]);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (!persona) {
      return res.status(404).json({
        success: false,
        message: 'Persona not found'
      });
    }

    // Check access permissions
    if (!campaign.canBeEditedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this campaign'
      });
    }

    if (!persona.isPredefined && persona.userId && !persona.isOwnedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this persona'
      });
    }

    // Add custom instructions to campaign context if provided
    if (customInstructions) {
      campaign.generationSettings = campaign.generationSettings || {};
      campaign.generationSettings.customInstructions = customInstructions;
    }

    // Generate social media content
    const socialContent = await aiService.generateSocialContent(persona, campaign, platform);

    // Add content to campaign
    await campaign.addContent(socialContent);

    res.json({
      success: true,
      message: `${platform} content generated successfully`,
      data: {
        content: socialContent
      }
    });

  } catch (error) {
    console.error('Generate social content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating social media content'
    });
  }
};

/**
 * Generate ad copy for a campaign
 * @route POST /api/content/generate-ad-copy
 * @access Private
 */
const generateAdCopy = async (req, res) => {
  try {
    const { campaignId, personaId, platform = 'google-ads', customInstructions } = req.body;
    const userId = req.userId;

    // Validate AI service availability
    if (!aiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI content generation service is not available. Please configure OpenAI API key.'
      });
    }

    // Get campaign and persona data
    const [campaign, persona] = await Promise.all([
      Campaign.findById(campaignId),
      Persona.findById(personaId)
    ]);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (!persona) {
      return res.status(404).json({
        success: false,
        message: 'Persona not found'
      });
    }

    // Check access permissions
    if (!campaign.canBeEditedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this campaign'
      });
    }

    if (!persona.isPredefined && persona.userId && !persona.isOwnedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this persona'
      });
    }

    // Add custom instructions to campaign context if provided
    if (customInstructions) {
      campaign.generationSettings = campaign.generationSettings || {};
      campaign.generationSettings.customInstructions = customInstructions;
    }

    // Generate ad copy
    const adContent = await aiService.generateAdCopy(persona, campaign, platform);

    // Add content to campaign
    await campaign.addContent(adContent);

    res.json({
      success: true,
      message: 'Ad copy generated successfully',
      data: {
        content: adContent
      }
    });

  } catch (error) {
    console.error('Generate ad copy error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating ad copy'
    });
  }
};

/**
 * Generate multiple content variations for A/B testing
 * @route POST /api/content/generate-variations
 * @access Private
 */
const generateContentVariations = async (req, res) => {
  try {
    const { campaignId, personaId, contentType, variations = 2, platform } = req.body;
    const userId = req.userId;

    // Validate AI service availability
    if (!aiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI content generation service is not available. Please configure OpenAI API key.'
      });
    }

    // Validate inputs
    const validContentTypes = ['email', 'social_post', 'ad_copy'];
    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type specified'
      });
    }

    if (variations < 2 || variations > 5) {
      return res.status(400).json({
        success: false,
        message: 'Number of variations must be between 2 and 5'
      });
    }

    // Get campaign and persona data
    const [campaign, persona] = await Promise.all([
      Campaign.findById(campaignId),
      Persona.findById(personaId)
    ]);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (!persona) {
      return res.status(404).json({
        success: false,
        message: 'Persona not found'
      });
    }

    // Check access permissions
    if (!campaign.canBeEditedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this campaign'
      });
    }

    if (!persona.isPredefined && persona.userId && !persona.isOwnedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this persona'
      });
    }

    // Set platform for social posts if needed
    if (contentType === 'social_post') {
      campaign.generationSettings = campaign.generationSettings || {};
      campaign.generationSettings.platforms = platform ? [platform] : ['linkedin'];
    }

    // Generate content variations
    const contentVariations = await aiService.generateContentVariations(
      persona, 
      campaign, 
      contentType, 
      variations
    );

    // Add all variations to campaign
    for (const content of contentVariations) {
      await campaign.addContent(content);
    }

    res.json({
      success: true,
      message: `${variations} ${contentType} variations generated successfully`,
      data: {
        variations: contentVariations
      }
    });

  } catch (error) {
    console.error('Generate content variations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating content variations'
    });
  }
};

/**
 * Batch generate content for multiple platforms
 * @route POST /api/content/batch-generate
 * @access Private
 */
const batchGenerateContent = async (req, res) => {
  try {
    const { 
      campaignId, 
      personaId, 
      contentTypes = ['email', 'social_post'], 
      platforms = ['email', 'linkedin'],
      customInstructions 
    } = req.body;
    const userId = req.userId;

    // Validate AI service availability
    if (!aiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI content generation service is not available. Please configure OpenAI API key.'
      });
    }

    // Get campaign and persona data
    const [campaign, persona] = await Promise.all([
      Campaign.findById(campaignId),
      Persona.findById(personaId)
    ]);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (!persona) {
      return res.status(404).json({
        success: false,
        message: 'Persona not found'
      });
    }

    // Check access permissions
    if (!campaign.canBeEditedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this campaign'
      });
    }

    if (!persona.isPredefined && persona.userId && !persona.isOwnedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this persona'
      });
    }

    // Add custom instructions to campaign context if provided
    if (customInstructions) {
      campaign.generationSettings = campaign.generationSettings || {};
      campaign.generationSettings.customInstructions = customInstructions;
    }

    const generatedContent = [];
    const errors = [];

    // Generate content for each type and platform
    for (const contentType of contentTypes) {
      try {
        if (contentType === 'email') {
          const emailContent = await aiService.generateEmailContent(persona, campaign);
          await campaign.addContent(emailContent);
          generatedContent.push(emailContent);
        } else if (contentType === 'social_post') {
          const socialPlatforms = platforms.filter(p => p !== 'email');
          for (const platform of socialPlatforms) {
            const socialContent = await aiService.generateSocialContent(persona, campaign, platform);
            await campaign.addContent(socialContent);
            generatedContent.push(socialContent);
          }
        } else if (contentType === 'ad_copy') {
          const adContent = await aiService.generateAdCopy(persona, campaign);
          await campaign.addContent(adContent);
          generatedContent.push(adContent);
        }
      } catch (error) {
        console.error(`Error generating ${contentType}:`, error);
        errors.push(`Failed to generate ${contentType}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Batch content generation completed. Generated ${generatedContent.length} pieces of content.`,
      data: {
        generatedContent,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Batch generate content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while batch generating content'
    });
  }
};

/**
 * Get AI service status
 * @route GET /api/content/ai-status
 * @access Private
 */
const getAIStatus = async (req, res) => {
  try {
    const isAvailable = aiService.isAvailable();
    
    res.json({
      success: true,
      data: {
        available: isAvailable,
        message: isAvailable 
          ? 'AI content generation service is available'
          : 'AI service not configured. Please set OPENAI_API_KEY environment variable.'
      }
    });
  } catch (error) {
    console.error('Get AI status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while checking AI service status'
    });
  }
};

module.exports = {
  generateEmailContent,
  generateSocialContent,
  generateAdCopy,
  generateContentVariations,
  batchGenerateContent,
  getAIStatus
};
