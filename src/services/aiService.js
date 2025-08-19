const OpenAI = require("openai");

class AIContentGenerator {
  constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Content generation templates and prompts
    this.prompts = {
      email: {
        subject: `Create an engaging email subject line for a marketing campaign with the following details:
        
Campaign Objective: {objective}
Target Persona: {personaName}
Demographics: {demographics}
Pain Points: {painPoints}
Goals: {goals}
Tone: {tone}
Keywords: {keywords}

Generate a subject line that:
- Captures attention and creates urgency
- Speaks directly to the persona's pain points or goals
- Uses the specified tone
- Is under 50 characters
- Avoids spam trigger words

Return only the subject line without quotes.`,

        body: `Write a compelling marketing email for the following campaign:

Campaign: {campaignName}
Objective: {objective}
Target Persona: {personaName}
Description: {personaDescription}
Demographics: {demographics}
Values: {values}
Interests: {interests}
Pain Points: {painPoints}
Goals: {goals}
Preferred Channels: {preferredChannels}
Tone: {tone}
Keywords: {keywords}
Subject Line: {subjectLine}

Write an email that:
- Addresses the persona's specific pain points
- Offers clear value aligned with their goals
- Uses the specified tone consistently
- Includes a compelling call-to-action
- Is personalized and engaging
- Is 200-400 words long
- Follows email marketing best practices

Format the email with proper structure (greeting, body, CTA, closing).`,
      },

      social: {
        post: `Create a {platform} social media post for this marketing campaign:

Campaign: {campaignName}
Objective: {objective}
Target Persona: {personaName}
Description: {personaDescription}
Demographics: {demographics}
Values: {values}
Interests: {interests}
Pain Points: {painPoints}
Goals: {goals}
Tone: {tone}
Keywords: {keywords}
Platform: {platform}

Create a post that:
- Speaks directly to the target persona
- Addresses their pain points or goals
- Uses platform-appropriate length and format
- Includes relevant hashtags (3-5 for most platforms)
- Has a clear call-to-action
- Uses the specified tone
- Encourages engagement

Platform-specific requirements:
- LinkedIn: Professional, value-driven, 150-300 words
- Facebook: Conversational, community-focused, 100-200 words
- Twitter: Concise, witty, under 280 characters
- Instagram: Visual-focused, inspiring, 100-150 words

Include suggested hashtags at the end.`,
      },

      adCopy: {
        short: `Write compelling ad copy for this campaign:

Campaign: {campaignName}
Objective: {objective}
Target Persona: {personaName}
Description: {personaDescription}
Demographics: {demographics}
Pain Points: {painPoints}
Goals: {goals}
Tone: {tone}
Keywords: {keywords}
Platform: {platform}

Create ad copy that:
- Grabs attention immediately
- Addresses specific pain points
- Offers clear value proposition
- Includes a strong call-to-action
- Uses persuasive language
- Follows platform character limits
- Avoids overly promotional language

Format: Headline (under 30 characters), Description (under 90 characters), Call-to-action (under 20 characters)`,
      },
    };

    // Quality scoring criteria
    this.qualityCriteria = {
      relevance: "How well does the content address the target persona?",
      clarity: "Is the message clear and easy to understand?",
      engagement: "How likely is this to generate engagement?",
      persuasiveness: "How compelling is the call-to-action?",
      toneBrand: "Does it match the specified tone and brand voice?",
    };
  }

  /**
   * Generate email content for a campaign
   * @param {Object} persona - Target persona data
   * @param {Object} campaign - Campaign data
   * @returns {Object} Generated email content
   */
  async generateEmailContent(persona, campaign) {
    try {
      const context = this.buildContext(persona, campaign);

      // Generate subject line
      const subjectPrompt = this.prompts.email.subject.replace(
        /\{(\w+)\}/g,
        (match, key) => {
          return context[key] || match;
        }
      );

      const subjectResponse = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert email marketing copywriter. Generate compelling, high-converting email subject lines.",
          },
          {
            role: "user",
            content: subjectPrompt,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      });

      const subjectLine = subjectResponse.choices[0].message.content.trim();

      // Generate email body
      const bodyPrompt = this.prompts.email.body.replace(
        /\{(\w+)\}/g,
        (match, key) => {
          if (key === "subjectLine") return subjectLine;
          return context[key] || match;
        }
      );

      const bodyResponse = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert email marketing copywriter. Write engaging, personalized email content that converts.",
          },
          {
            role: "user",
            content: bodyPrompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const contentBody = bodyResponse.choices[0].message.content.trim();

      // Score the content quality
      const qualityScore = await this.scoreContentQuality(
        contentBody,
        persona,
        "email"
      );

      return {
        contentType: "email",
        platform: "email",
        subjectLine,
        contentBody,
        qualityScore,
        generationPrompt: bodyPrompt.substring(0, 500) + "...",
        createdAt: new Date(),
      };
    } catch (error) {
      console.error("Error generating email content:", error);
      throw new Error("Failed to generate email content");
    }
  }

  /**
   * Generate social media content for a campaign
   * @param {Object} persona - Target persona data
   * @param {Object} campaign - Campaign data
   * @param {String} platform - Social media platform
   * @returns {Object} Generated social content
   */
  async generateSocialContent(persona, campaign, platform) {
    try {
      const context = this.buildContext(persona, campaign, platform);

      const prompt = this.prompts.social.post.replace(
        /\{(\w+)\}/g,
        (match, key) => {
          return context[key] || match;
        }
      );

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert social media marketing specialist focused on ${platform}. Create engaging, platform-optimized content that drives engagement and conversions.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: platform === "twitter" ? 150 : 600,
        temperature: 0.8,
      });

      const content = response.choices[0].message.content.trim();

      // Extract hashtags from the content
      const hashtagRegex = /#[\w]+/g;
      const hashtags = content.match(hashtagRegex) || [];

      // Remove hashtags from main content if they're at the end
      const contentBody = content.replace(/\n\n#[\w\s#]+$/, "").trim();

      // Score the content quality
      const qualityScore = await this.scoreContentQuality(
        contentBody,
        persona,
        "social_post"
      );

      return {
        contentType: "social_post",
        platform,
        contentBody,
        hashtags,
        qualityScore,
        generationPrompt: prompt.substring(0, 500) + "...",
        createdAt: new Date(),
      };
    } catch (error) {
      console.error("Error generating social content:", error);
      throw new Error("Failed to generate social media content");
    }
  }

  /**
   * Generate ad copy for a campaign
   * @param {Object} persona - Target persona data
   * @param {Object} campaign - Campaign data
   * @param {String} platform - Advertising platform
   * @returns {Object} Generated ad copy
   */
  async generateAdCopy(persona, campaign, platform = "google-ads") {
    try {
      const context = this.buildContext(persona, campaign, platform);

      const prompt = this.prompts.adCopy.short.replace(
        /\{(\w+)\}/g,
        (match, key) => {
          return context[key] || match;
        }
      );

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert digital advertising copywriter. Create high-converting ad copy that maximizes click-through rates and conversions.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const contentBody = response.choices[0].message.content.trim();

      // Score the content quality
      const qualityScore = await this.scoreContentQuality(
        contentBody,
        persona,
        "ad_copy"
      );

      return {
        contentType: "ad_copy",
        platform,
        contentBody,
        qualityScore,
        generationPrompt: prompt.substring(0, 500) + "...",
        createdAt: new Date(),
      };
    } catch (error) {
      console.error("Error generating ad copy:", error);
      throw new Error("Failed to generate ad copy");
    }
  }

  /**
   * Score content quality based on persona alignment and best practices
   * @param {String} content - Generated content
   * @param {Object} persona - Target persona
   * @param {String} contentType - Type of content
   * @returns {Number} Quality score (0-100)
   */
  async scoreContentQuality(content, persona, contentType) {
    try {
      const scoringPrompt = `Rate the quality of this ${contentType} content for the target persona on a scale of 0-100:

Content: "${content}"

Target Persona:
- Name: ${persona.name}
- Description: ${persona.description}
- Pain Points: ${persona.painPoints?.join(", ")}
- Goals: ${persona.goals?.join(", ")}
- Values: ${persona.psychographics?.values?.join(", ")}

Evaluate based on:
1. Relevance to persona (25 points)
2. Clarity and readability (20 points)
3. Engagement potential (20 points)
4. Persuasiveness and CTA strength (20 points)
5. Tone and brand alignment (15 points)

Return only a number between 0-100.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a marketing content quality analyst. Provide objective scores based on marketing best practices.",
          },
          {
            role: "user",
            content: scoringPrompt,
          },
        ],
        max_tokens: 10,
        temperature: 0.3,
      });

      const scoreText = response.choices[0].message.content.trim();
      const score = parseInt(scoreText) || 0;

      // Ensure score is within valid range
      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error("Error scoring content quality:", error);
      // Return a default score if scoring fails
      return 75;
    }
  }

  /**
   * Generate multiple content variations for A/B testing
   * @param {Object} persona - Target persona data
   * @param {Object} campaign - Campaign data
   * @param {String} contentType - Type of content to generate
   * @param {Number} variations - Number of variations to generate
   * @returns {Array} Array of content variations
   */
  async generateContentVariations(
    persona,
    campaign,
    contentType,
    variations = 2
  ) {
    const promises = [];

    for (let i = 0; i < variations; i++) {
      if (contentType === "email") {
        promises.push(this.generateEmailContent(persona, campaign));
      } else if (contentType === "social_post") {
        const platforms = campaign.generationSettings?.platforms || [
          "linkedin",
        ];
        promises.push(
          this.generateSocialContent(persona, campaign, platforms[0])
        );
      } else if (contentType === "ad_copy") {
        promises.push(this.generateAdCopy(persona, campaign));
      }
    }

    try {
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error("Error generating content variations:", error);
      throw new Error("Failed to generate content variations");
    }
  }

  /**
   * Build context object for prompt generation
   * @param {Object} persona - Target persona data
   * @param {Object} campaign - Campaign data
   * @param {String} platform - Platform (optional)
   * @returns {Object} Context object
   */
  buildContext(persona, campaign, platform = "") {
    return {
      campaignName: campaign.name,
      objective: campaign.objective,
      personaName: persona.name,
      personaDescription: persona.description,
      demographics: `Age: ${persona.demographics?.age || "N/A"}, Income: ${
        persona.demographics?.income || "N/A"
      }, Location: ${persona.demographics?.location || "N/A"}`,
      values: persona.psychographics?.values?.join(", ") || "N/A",
      interests: persona.psychographics?.interests?.join(", ") || "N/A",
      painPoints: persona.painPoints?.join(", ") || "N/A",
      goals: persona.goals?.join(", ") || "N/A",
      preferredChannels: persona.preferredChannels?.join(", ") || "N/A",
      tone: campaign.tone || "professional",
      keywords: campaign.keywords || "",
      platform: platform || "general",
    };
  }

  /**
   * Check if AI service is available
   * @returns {Boolean} Service availability status
   */
  isAvailable() {
    return !!process.env.OPENAI_API_KEY;
  }
}

module.exports = AIContentGenerator;
