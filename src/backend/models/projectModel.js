
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Project description is required']
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      maxlength: [200, 'Short description cannot exceed 200 characters']
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required']
    },
    coordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Coordinator is required']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Education',
        'Environment',
        'Health',
        'Animals',
        'Arts',
        'Community',
        'Crisis Response',
        'Food Security',
        'Housing',
        'Social Justice',
        'Technology',
        'Other'
      ]
    },
    skillsRequired: [{
      type: String,
      trim: true
    }],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      },
      address: String,
      city: {
        type: String,
        required: [true, 'City is required']
      },
      state: String,
      zipCode: String,
      country: {
        type: String,
        required: [true, 'Country is required']
      },
      isRemote: {
        type: Boolean,
        default: false
      }
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: Date,
    capacity: {
      type: Number,
      default: 1
    },
    volunteers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'waitlisted', 'completed'],
        default: 'pending'
      },
      appliedAt: {
        type: Date,
        default: Date.now
      },
      hoursLogged: {
        type: Number,
        default: 0
      },
      feedback: String
    }],
    media: [{
      type: {
        type: String,
        enum: ['image', 'video'],
        required: true
      },
      url: {
        type: String,
        required: true
      },
      caption: String
    }],
    coverImage: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'cancelled'],
      default: 'draft'
    },
    tags: [String],
    requirements: {
      minAge: Number,
      background: {
        required: Boolean,
        details: String
      },
      training: {
        required: Boolean,
        details: String
      }
    },
    featured: {
      type: Boolean,
      default: false
    },
    impact: {
      peopleHelped: Number,
      hoursContributed: Number,
      fundsRaised: Number,
      description: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for geolocation queries
projectSchema.index({ location: '2dsphere' });

// Virtual for calculating open spots
projectSchema.virtual('openSpots').get(function() {
  const approvedVolunteers = this.volunteers.filter(vol => vol.status === 'approved').length;
  return Math.max(this.capacity - approvedVolunteers, 0);
});

// Virtual for determining if the project is full
projectSchema.virtual('isFull').get(function() {
  return this.openSpots === 0;
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
