
const express = require('express');
const User = require('../models/userModel');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const router = express.Router();

// @desc    Get all users (with pagination)
// @route   GET /api/users
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
      
    const total = await User.countDocuments();
    
    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: users
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user is requesting their own info or is an admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user data'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    // Check if user is updating their own profile or is admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }
    
    // Fields to update
    const fieldsToUpdate = {
      name: req.body.name,
      bio: req.body.bio,
      skills: req.body.skills,
      interests: req.body.interests,
      availability: req.body.availability,
      contactPhone: req.body.contactPhone,
      location: req.body.location,
      emergencyContact: req.body.emergencyContact,
    };
    
    // Filter out undefined fields
    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });
    
    // Find user and update
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User profile updated',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Upload user resume
// @route   POST /api/users/:id/resume
// @access  Private
router.post(
  '/:id/resume',
  protect,
  async (req, res, next) => {
    try {
      // Check if user is uploading their own resume
      if (req.user.id !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to upload resume for this user'
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  },
  upload.single('resume'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a resume file'
        });
      }
      
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Update user with resume info
      user.resume = {
        url: `/uploads/resumes/${req.file.filename}`,
        filename: req.file.filename
      };
      
      await user.save();
      
      res.status(200).json({
        success: true,
        message: 'Resume uploaded successfully',
        data: user.resume
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Upload user avatar
// @route   POST /api/users/:id/avatar
// @access  Private
router.post(
  '/:id/avatar',
  protect,
  async (req, res, next) => {
    try {
      // Check if user is uploading their own avatar
      if (req.user.id !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to upload avatar for this user'
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  },
  upload.single('avatar'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload an image file'
        });
      }
      
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Update user with avatar path
      user.avatar = `/uploads/images/${req.file.filename}`;
      
      await user.save();
      
      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatar: user.avatar
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin or own user)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    // Check if user is deleting their own account or is admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this user'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get nearby volunteers
// @route   GET /api/users/nearby
// @access  Private (Coordinators and Admins)
router.get('/nearby', protect, authorize('coordinator', 'admin'), async (req, res, next) => {
  try {
    const { longitude, latitude, distance = 10 } = req.query; // distance in kilometers
    
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide longitude and latitude parameters'
      });
    }
    
    // Find volunteers near the given coordinates
    const volunteers = await User.find({
      role: 'volunteer',
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: distance * 1000 // convert to meters
        }
      }
    }).select('-password');
    
    res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
