const mongoose = require('mongoose');

const personaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      // userId is required only if it's not a predefined persona
      return !this.isPredefined;
    },
    index: true
  },
  name: {
    type: String,
    required: [true, 'Persona name is required'],
    trim: true,
    maxlength: [100, 'Persona name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Persona description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  demographics: {
    age: {
      type: String,
      required: [true, 'Age range is required'],
      trim: true
    },
    income: {
      type: String,
      required: [true, 'Income range is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    }
  },
  psychographics: {
    values: [{
      type: String,
      trim: true
    }],
    interests: [{
      type: String,
      trim: true
    }]
  },
  painPoints: [{
    type: String,
    trim: true,
    maxlength: [200, 'Pain point cannot exceed 200 characters']
  }],
  goals: [{
    type: String,
    trim: true,
    maxlength: [200, 'Goal cannot exceed 200 characters']
  }],
  preferredChannels: [{
    type: String,
    enum: [
      'email', 'instagram', 'facebook', 'twitter', 'linkedin', 
      'tiktok', 'youtube', 'google-ads', 'sms', 'whatsapp',
      'tech-blogs', 'newspapers', 'radio', 'tv', 'podcasts'
    ]
  }],
  isPredefined: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
personaSchema.index({ userId: 1, isPredefined: 1 });
personaSchema.index({ isPredefined: 1, createdAt: -1 });
personaSchema.index({ name: 'text', description: 'text' }); // For text search

// Virtual for persona summary
personaSchema.virtual('summary').get(function() {
  return {
    name: this.name,
    ageRange: this.demographics.age,
    primaryChannels: this.preferredChannels.slice(0, 3),
    keyValues: this.psychographics.values.slice(0, 3)
  };
});

// Ensure virtual fields are serialized
personaSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

// Validation for required arrays
personaSchema.pre('validate', function(next) {
  if (this.painPoints && this.painPoints.length === 0) {
    this.invalidate('painPoints', 'At least one pain point is required');
  }
  if (this.goals && this.goals.length === 0) {
    this.invalidate('goals', 'At least one goal is required');
  }
  if (this.preferredChannels && this.preferredChannels.length === 0) {
    this.invalidate('preferredChannels', 'At least one preferred channel is required');
  }
  next();
});

// Static method to find user's personas
personaSchema.statics.findByUser = function(userId) {
  return this.find({ 
    $or: [
      { userId: userId },
      { isPredefined: true }
    ]
  }).sort({ isPredefined: 1, createdAt: -1 });
};

// Static method to find predefined personas
personaSchema.statics.findPredefined = function() {
  return this.find({ isPredefined: true }).sort({ createdAt: -1 });
};

// Static method to search personas
personaSchema.statics.searchPersonas = function(userId, searchTerm) {
  return this.find({
    $and: [
      {
        $or: [
          { userId: userId },
          { isPredefined: true }
        ]
      },
      {
        $text: { $search: searchTerm }
      }
    ]
  }).sort({ score: { $meta: 'textScore' } });
};

// Instance method to check if user owns this persona
personaSchema.methods.isOwnedBy = function(userId) {
  return this.userId && this.userId.toString() === userId.toString();
};

// Instance method to check if persona can be edited by user
personaSchema.methods.canBeEditedBy = function(userId) {
  // Predefined personas cannot be edited
  if (this.isPredefined) return false;
  // User can only edit their own personas
  return this.isOwnedBy(userId);
};

module.exports = mongoose.model('Persona', personaSchema);
