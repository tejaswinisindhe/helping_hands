
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
      type: String,
      enum: ['volunteer', 'admin', 'coordinator'],
      default: 'volunteer'
    },
    avatar: {
      type: String,
      default: ''
    },
    skills: [String],
    bio: {
      type: String,
      default: ''
    },
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
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    resume: {
      url: String,
      filename: String
    },
    interests: [String],
    availability: {
      weekdays: Boolean,
      weekends: Boolean,
      evenings: Boolean,
      fullTime: Boolean
    },
    contactPhone: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },
    projects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    }],
    badges: [{
      name: String,
      description: String,
      image: String,
      dateEarned: Date
    }],
    hoursLogged: {
      type: Number,
      default: 0
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    googleId: String,
    active: {
      type: Boolean,
      default: true
    },
    lastActive: Date
  },
  { 
    timestamps: true 
  }
);

// Index for geolocation queries
userSchema.index({ location: '2dsphere' });

// Pre-save hook to hash the password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
