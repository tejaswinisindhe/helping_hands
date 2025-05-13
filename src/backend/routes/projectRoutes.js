
const express = require('express');
const Project = require('../models/projectModel');
const User = require('../models/userModel');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const router = express.Router();

// @desc    Get all projects (with pagination and filtering)
// @route   GET /api/projects
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Build query
    const queryObj = { status: 'active' }; // Default to active projects
    
    // Filter by category
    if (req.query.category) {
      queryObj.category = req.query.category;
    }
    
    // Filter by location (city)
    if (req.query.city) {
      queryObj['location.city'] = new RegExp(req.query.city, 'i');
    }
    
    // Filter by skills
    if (req.query.skills) {
      const skills = req.query.skills.split(',');
      queryObj.skillsRequired = { $in: skills };
    }
    
    // Filter by date
    if (req.query.after) {
      queryObj.startDate = { $gte: new Date(req.query.after) };
    }
    
    // Filter by organization
    if (req.query.organization) {
      queryObj.organization = req.query.organization;
    }
    
    // Execute query with pagination
    const projects = await Project.find(queryObj)
      .sort({ featured: -1, startDate: 1 })
      .skip(startIndex)
      .limit(limit)
      .populate('coordinator', 'name avatar');
      
    // Get total count
    const total = await Project.countDocuments(queryObj);
    
    res.status(200).json({
      success: true,
      count: projects.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: projects
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('coordinator', 'name email avatar')
      .populate('organization', 'name logo description')
      .populate('volunteers.user', 'name avatar');
      
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Coordinators and Admins)
router.post('/', protect, authorize('coordinator', 'admin'), async (req, res, next) => {
  try {
    // Add coordinator to project
    req.body.coordinator = req.user.id;
    
    const project = await Project.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Project coordinator or Admin)
router.put('/:id', protect, async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check if user is project coordinator or admin
    if (
      project.coordinator.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project'
      });
    }
    
    // Update project
    project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Project coordinator or Admin)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check if user is project coordinator or admin
    if (
      project.coordinator.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this project'
      });
    }
    
    await project.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Apply for a project
// @route   POST /api/projects/:id/apply
// @access  Private (Volunteers)
router.post('/:id/apply', protect, authorize('volunteer'), async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check if project is active
    if (project.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot apply to ${project.status} project`
      });
    }
    
    // Check if user already applied
    const alreadyApplied = project.volunteers.some(volunteer => 
      volunteer.user.toString() === req.user.id
    );
    
    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: 'Already applied to this project'
      });
    }
    
    // Add user to volunteers array
    project.volunteers.push({
      user: req.user.id,
      status: 'pending',
      appliedAt: Date.now()
    });
    
    await project.save();
    
    // Add project to user's projects list
    await User.findByIdAndUpdate(req.user.id, {
      $push: { projects: project._id }
    });
    
    res.status(200).json({
      success: true,
      message: 'Applied to project successfully',
      data: {
        projectId: project._id,
        status: 'pending'
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update volunteer application status
// @route   PUT /api/projects/:id/applications/:userId
// @access  Private (Project coordinator or Admin)
router.put('/:id/applications/:userId', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected', 'waitlisted', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved, rejected, waitlisted, or completed'
      });
    }
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check if user is project coordinator or admin
    if (
      project.coordinator.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update application status'
      });
    }
    
    // Find volunteer application
    const volunteerApplication = project.volunteers.find(
      volunteer => volunteer.user.toString() === req.params.userId
    );
    
    if (!volunteerApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Update status
    volunteerApplication.status = status;
    
    // If approving and project is full, return error
    if (status === 'approved' && project.isFull) {
      return res.status(400).json({
        success: false,
        message: 'Project is full, cannot approve more volunteers'
      });
    }
    
    await project.save();
    
    res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      data: {
        projectId: project._id,
        volunteerId: req.params.userId,
        status
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Upload project images
// @route   POST /api/projects/:id/media
// @access  Private (Project coordinator or Admin)
router.post(
  '/:id/media',
  protect,
  async (req, res, next) => {
    try {
      const project = await Project.findById(req.params.id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }
      
      // Check if user is project coordinator or admin
      if (
        project.coordinator.toString() !== req.user.id &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to upload media for this project'
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  },
  upload.array('media', 5),
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please upload at least one file'
        });
      }
      
      const project = await Project.findById(req.params.id);
      
      // Process uploaded files
      const mediaItems = req.files.map(file => ({
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        url: `/uploads/images/${file.filename}`,
        caption: req.body.caption || ''
      }));
      
      // Add to project media
      project.media.push(...mediaItems);
      
      // If it's the first image and no cover image exists, set as cover
      if (mediaItems.some(item => item.type === 'image') && !project.coverImage) {
        const firstImage = mediaItems.find(item => item.type === 'image');
        project.coverImage = firstImage.url;
      }
      
      await project.save();
      
      res.status(200).json({
        success: true,
        message: 'Media uploaded successfully',
        data: project.media
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Log volunteer hours
// @route   POST /api/projects/:id/hours/:userId
// @access  Private (Project coordinator or Admin)
router.post('/:id/hours/:userId', protect, async (req, res, next) => {
  try {
    const { hours, feedback } = req.body;
    
    if (!hours || hours <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid number of hours'
      });
    }
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check if user is project coordinator or admin
    if (
      project.coordinator.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to log hours for this project'
      });
    }
    
    // Find volunteer
    const volunteerIndex = project.volunteers.findIndex(
      volunteer => volunteer.user.toString() === req.params.userId
    );
    
    if (volunteerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found in project'
      });
    }
    
    // Add hours to volunteer's project record
    project.volunteers[volunteerIndex].hoursLogged += parseFloat(hours);
    
    if (feedback) {
      project.volunteers[volunteerIndex].feedback = feedback;
    }
    
    await project.save();
    
    // Add hours to user's total hours
    const user = await User.findById(req.params.userId);
    user.hoursLogged += parseFloat(hours);
    await user.save();
    
    // Add hours to project impact
    project.impact = project.impact || {};
    project.impact.hoursContributed = (project.impact.hoursContributed || 0) + parseFloat(hours);
    await project.save();
    
    res.status(200).json({
      success: true,
      message: 'Hours logged successfully',
      data: {
        projectId: project._id,
        volunteerId: req.params.userId,
        hours: project.volunteers[volunteerIndex].hoursLogged,
        totalUserHours: user.hoursLogged
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
