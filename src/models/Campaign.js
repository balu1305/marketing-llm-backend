const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

// Content schema for embedded content within campaigns
const contentSchema = new mongoose.Schema(
  {
    contentType: {
      type: String,
      enum: ["email", "social_post", "ad_copy", "blog_post"],
      required: [true, "Content type is required"],
    },
    platform: {
      type: String,
      enum: [
        "email",
        "linkedin",
        "facebook",
        "twitter",
        "instagram",
        "youtube",
        "tiktok",
      ],
      required: [true, "Platform is required"],
    },
    subjectLine: {
      type: String,
      trim: true,
      maxlength: [200, "Subject line cannot exceed 200 characters"],
    },
    contentBody: {
      type: String,
      required: [true, "Content body is required"],
      trim: true,
      maxlength: [5000, "Content body cannot exceed 5000 characters"],
    },
    visualUrl: {
      type: String,
      trim: true,
    },
    hashtags: [
      {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            return v.startsWith("#");
          },
          message: "Hashtags must start with #",
        },
      },
    ],
    qualityScore: {
      type: Number,
      min: [0, "Quality score cannot be negative"],
      max: [100, "Quality score cannot exceed 100"],
      default: 0,
    },
    engagementMetrics: {
      views: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    generationPrompt: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// A/B Test schema for embedded A/B tests within campaigns
const abTestSchema = new mongoose.Schema(
  {
    testName: {
      type: String,
      required: [true, "Test name is required"],
      trim: true,
      maxlength: [100, "Test name cannot exceed 100 characters"],
    },
    testType: {
      type: String,
      enum: ["subject_line", "content_body", "visual", "cta", "send_time"],
      required: [true, "Test type is required"],
    },
    status: {
      type: String,
      enum: ["draft", "running", "completed", "cancelled"],
      default: "draft",
    },
    variantA: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Variant A is required"],
    },
    variantB: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Variant B is required"],
    },
    winner: {
      type: String,
      enum: ["variant_a", "variant_b", "inconclusive"],
      default: "inconclusive",
    },
    confidence: {
      type: Number,
      min: [0, "Confidence cannot be negative"],
      max: [100, "Confidence cannot exceed 100"],
      default: 0,
    },
    metrics: {
      variantA: {
        participants: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 },
      },
      variantB: {
        participants: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 },
      },
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Main Campaign schema
const campaignSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    personaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Persona",
      required: [true, "Persona ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Campaign name is required"],
      trim: true,
      maxlength: [200, "Campaign name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    objective: {
      type: String,
      enum: [
        "awareness",
        "engagement",
        "conversion",
        "retention",
        "lead_generation",
      ],
      required: [true, "Campaign objective is required"],
    },
    status: {
      type: String,
      enum: [
        "draft",
        "generating",
        "active",
        "paused",
        "completed",
        "archived",
      ],
      default: "draft",
      index: true,
    },
    budget: {
      type: Number,
      min: [0, "Budget cannot be negative"],
      default: 0,
    },
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "INR", "CAD", "AUD"],
      default: "USD",
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (v) {
          return v > this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    tone: {
      type: String,
      enum: [
        "professional",
        "casual",
        "friendly",
        "urgent",
        "humorous",
        "inspiring",
        "authoritative",
      ],
      default: "professional",
    },
    keywords: {
      type: String,
      trim: true,
      maxlength: [500, "Keywords cannot exceed 500 characters"],
    },
    targetAudience: {
      size: {
        type: Number,
        min: [0, "Audience size cannot be negative"],
      },
      demographics: {
        type: mongoose.Schema.Types.Mixed,
      },
      interests: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    // Embedded content array
    content: [contentSchema],

    // Embedded A/B tests array
    abTests: [abTestSchema],

    // Campaign performance metrics
    metrics: {
      totalReach: { type: Number, default: 0 },
      totalImpressions: { type: Number, default: 0 },
      totalClicks: { type: Number, default: 0 },
      totalConversions: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 }, // Click-through rate
      cpc: { type: Number, default: 0 }, // Cost per click
      cpa: { type: Number, default: 0 }, // Cost per acquisition
      roi: { type: Number, default: 0 }, // Return on investment
    },

    // Generation settings
    generationSettings: {
      contentTypes: [
        {
          type: String,
          enum: ["email", "social_post", "ad_copy", "blog_post"],
        },
      ],
      platforms: [
        {
          type: String,
          enum: [
            "email",
            "linkedin",
            "facebook",
            "twitter",
            "instagram",
            "youtube",
            "tiktok",
          ],
        },
      ],
      creativityLevel: {
        type: Number,
        min: [0, "Creativity level cannot be negative"],
        max: [10, "Creativity level cannot exceed 10"],
        default: 5,
      },
      includeVisuals: {
        type: Boolean,
        default: false,
      },
      customInstructions: {
        type: String,
        trim: true,
        maxlength: [1000, "Custom instructions cannot exceed 1000 characters"],
      },
    },

    // Job tracking for async generation
    generationJob: {
      jobId: String,
      status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"],
        default: "pending",
      },
      progress: {
        type: Number,
        min: [0, "Progress cannot be negative"],
        max: [100, "Progress cannot exceed 100"],
        default: 0,
      },
      error: String,
      startedAt: Date,
      completedAt: Date,
    },

    // Collaboration features
    collaborators: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["viewer", "editor", "admin"],
          default: "viewer",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
campaignSchema.index({ userId: 1, status: 1 });
campaignSchema.index({ userId: 1, createdAt: -1 });
campaignSchema.index({ startDate: 1, endDate: 1 });
campaignSchema.index({ objective: 1, status: 1 });
campaignSchema.index({ tags: 1 });
campaignSchema.index({ isArchived: 1, userId: 1 });

// Text search index
campaignSchema.index({
  name: "text",
  description: "text",
  keywords: "text",
});

// Add pagination plugin
campaignSchema.plugin(mongoosePaginate);

// Virtual for campaign duration
campaignSchema.virtual("duration").get(function () {
  if (this.startDate && this.endDate) {
    return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for campaign progress
campaignSchema.virtual("progress").get(function () {
  const now = new Date();
  if (now < this.startDate) return 0;
  if (now > this.endDate) return 100;

  const total = this.endDate - this.startDate;
  const elapsed = now - this.startDate;
  return Math.round((elapsed / total) * 100);
});

// Virtual for content count by type
campaignSchema.virtual("contentStats").get(function () {
  const stats = {};
  this.content.forEach((item) => {
    stats[item.contentType] = (stats[item.contentType] || 0) + 1;
  });
  return stats;
});

// Ensure virtual fields are serialized
campaignSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

// Pre-save middleware to update metrics
campaignSchema.pre("save", function (next) {
  // Calculate CTR if we have impressions and clicks
  if (this.metrics.totalImpressions > 0) {
    this.metrics.ctr =
      (this.metrics.totalClicks / this.metrics.totalImpressions) * 100;
  }

  // Calculate CPC if we have clicks and spent amount
  if (this.metrics.totalClicks > 0) {
    this.metrics.cpc = this.metrics.totalSpent / this.metrics.totalClicks;
  }

  // Calculate CPA if we have conversions and spent amount
  if (this.metrics.totalConversions > 0) {
    this.metrics.cpa = this.metrics.totalSpent / this.metrics.totalConversions;
  }

  next();
});

// Static method to find user's campaigns
campaignSchema.statics.findByUser = function (userId, options = {}) {
  const query = { userId, isArchived: false };

  if (options.status) {
    query.status = options.status;
  }

  if (options.objective) {
    query.objective = options.objective;
  }

  return this.find(query)
    .populate("personaId", "name description demographics")
    .populate("userId", "firstName lastName email")
    .sort({ createdAt: -1 });
};

// Static method to find active campaigns
campaignSchema.statics.findActiveCampaigns = function (userId) {
  const now = new Date();
  return this.find({
    userId,
    status: "active",
    startDate: { $lte: now },
    endDate: { $gte: now },
    isArchived: false,
  }).populate("personaId", "name");
};

// Instance method to check if user owns this campaign
campaignSchema.methods.isOwnedBy = function (userId) {
  return this.userId.toString() === userId.toString();
};

// Instance method to check if user can edit this campaign
campaignSchema.methods.canBeEditedBy = function (userId) {
  // Owner can always edit
  if (this.isOwnedBy(userId)) return true;

  // Check collaborators
  const collaborator = this.collaborators.find(
    (c) => c.userId.toString() === userId.toString()
  );

  return collaborator && ["editor", "admin"].includes(collaborator.role);
};

// Instance method to add content to campaign
campaignSchema.methods.addContent = function (contentData) {
  this.content.push(contentData);
  return this.save();
};

// Instance method to update campaign metrics
campaignSchema.methods.updateMetrics = function (metricsData) {
  Object.assign(this.metrics, metricsData);
  return this.save();
};

// Instance method to archive campaign
campaignSchema.methods.archive = function () {
  this.isArchived = true;
  this.status = "archived";
  return this.save();
};

module.exports = mongoose.model("Campaign", campaignSchema);
