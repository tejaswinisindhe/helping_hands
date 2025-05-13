
const express = require('express');
const mongoose = require('mongoose');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

// @desc    Get personal volunteer analytics
// @route   GET /api/analytics/volunteer
// @access  Private
router.get('/volunteer', protect, async (req, res, next) => {
  try {
    // Reference models through mongoose to avoid circular dependencies
    const User = mongoose.model('User');
    const Project = mongoose.model('Project');
    
    // Get user data including logged hours
    const user = await User.findById(req.user.id).select('hoursLogged');
    
    // Get projects with completed status for the user
    const completedProjects = await Project.countDocuments({
      volunteers: {
        $elemMatch: {
          user: req.user.id,
          status: 'completed'
        }
      }
    });
    
    // Get total projects user has applied to
    const totalProjects = await Project.countDocuments({
      'volunteers.user': req.user.id
    });
    
    // Get project categories distribution
    const projectCategories = await Project.aggregate([
      {
        $match: {
          'volunteers.user': mongoose.Types.ObjectId(req.user.id)
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get badges
    const userWithBadges = await User.findById(req.user.id).select('badges');
    
    // Get hours logged per month for the past 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const hoursPerMonth = await Project.aggregate([
      {
        $match: {
          'volunteers.user': mongoose.Types.ObjectId(req.user.id),
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $unwind: '$volunteers'
      },
      {
        $match: {
          'volunteers.user': mongoose.Types.ObjectId(req.user.id)
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          hours: { $sum: '$volunteers.hoursLogged' }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      }
    ]);
    
    // Format hours per month into an array for charts
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const formattedHoursPerMonth = hoursPerMonth.map(item => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      hours: item.hours
    }));
    
    res.status(200).json({
      success: true,
      data: {
        totalHours: user.hoursLogged || 0,
        totalProjects,
        completedProjects,
        projectCategories,
        badges: userWithBadges.badges || [],
        hoursPerMonth: formattedHoursPerMonth
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get project analytics
// @route   GET /api/analytics/project/:projectId
// @access  Private (Project coordinator or Admin)
router.get('/project/:projectId', protect, async (req, res, next) => {
  try {
    // Reference models
    const Project = mongoose.model('Project');
    
    const project = await Project.findById(req.params.projectId)
      .populate('volunteers.user', 'name avatar');
    
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
        message: 'Not authorized to view project analytics'
      });
    }
    
    // Calculate application statuses
    const applicationStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      waitlisted: 0,
      completed: 0,
      total: project.volunteers.length
    };
    
    project.volunteers.forEach(volunteer => {
      applicationStats[volunteer.status]++;
    });
    
    // Calculate total hours logged
    const totalHours = project.volunteers.reduce(
      (sum, volunteer) => sum + (volunteer.hoursLogged || 0),
      0
    );
    
    // Calculate fill rate
    const fillRate = project.capacity > 0
      ? (applicationStats.approved / project.capacity) * 100
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        title: project.title,
        applicationStats,
        totalHours,
        fillRate,
        totalVolunteers: project.volunteers.length,
        capacity: project.capacity,
        openSpots: project.openSpots,
        volunteers: project.volunteers,
        impact: project.impact || {}
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get organization-wide analytics
// @route   GET /api/analytics/organization
// @access  Private (Admin only)
router.get('/organization', protect, authorize('admin'), async (req, res, next) => {
  try {
    // Reference models
    const User = mongoose.model('User');
    const Project = mongoose.model('Project');
    
    // Get total counts
    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
    const totalCoordinators = await User.countDocuments({ role: 'coordinator' });
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: 'active' });
    const completedProjects = await Project.countDocuments({ status: 'completed' });
    
    // Get total hours logged across all projects
    const hoursResult = await Project.aggregate([
      {
        $unwind: '$volunteers'
      },
      {
        $group: {
          _id: null,
          totalHours: { $sum: '$volunteers.hoursLogged' }
        }
      }
    ]);
    const totalHours = hoursResult.length > 0 ? hoursResult[0].totalHours : 0;
    
    // Get project category distribution
    const projectsByCategory = await Project.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get volunteer growth by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const volunteerGrowth = await User.aggregate([
      {
        $match: {
          role: 'volunteer',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      }
    ]);
    
    // Format months for chart
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const formattedVolunteerGrowth = volunteerGrowth.map(item => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      volunteers: item.count
    }));
    
    // Get top projects by hours logged
    const topProjects = await Project.aggregate([
      {
        $unwind: '$volunteers'
      },
      {
        $group: {
          _id: '$_id',
          title: { $first: '$title' },
          totalHours: { $sum: '$volunteers.hoursLogged' },
          volunteerCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalHours: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    // Get top volunteers by hours
    const topVolunteers = await User.aggregate([
      {
        $match: { role: 'volunteer' }
      },
      {
        $sort: { hoursLogged: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          _id: 1,
          name: 1,
          avatar: 1,
          hoursLogged: 1
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalVolunteers + totalCoordinators,
          volunteers: totalVolunteers,
          coordinators: totalCoordinators
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects
        },
        impact: {
          totalHours,
          projectsByCategory
        },
        charts: {
          volunteerGrowth: formattedVolunteerGrowth,
          topProjects,
          topVolunteers
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
