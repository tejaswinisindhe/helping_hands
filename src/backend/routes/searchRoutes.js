
const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// @desc    Search projects and volunteers
// @route   GET /api/search
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { q, type = 'all', limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }
    
    const results = {
      projects: [],
      volunteers: []
    };
    
    // Reference models
    const Project = mongoose.model('Project');
    const User = mongoose.model('User');
    
    // Search projects if type is 'all' or 'projects'
    if (type === 'all' || type === 'projects') {
      results.projects = await Project.find({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { shortDescription: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } },
          { skillsRequired: { $regex: q, $options: 'i' } },
          { 'location.city': { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } }
        ]
      })
        .limit(parseInt(limit))
        .select('title shortDescription coverImage category location.city startDate')
        .sort({ featured: -1, startDate: 1 });
    }
    
    // Search volunteers if type is 'all' or 'volunteers'
    if ((type === 'all' || type === 'volunteers') && 
        (req.user.role === 'coordinator' || req.user.role === 'admin')) {
      results.volunteers = await User.find({
        role: 'volunteer',
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { skills: { $regex: q, $options: 'i' } },
          { bio: { $regex: q, $options: 'i' } },
          { interests: { $regex: q, $options: 'i' } },
          { 'location.city': { $regex: q, $options: 'i' } }
        ]
      })
        .limit(parseInt(limit))
        .select('name email avatar skills location.city hoursLogged');
    }
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Advanced search with filters
// @route   GET /api/search/advanced
// @access  Private
router.get('/advanced', protect, async (req, res, next) => {
  try {
    const {
      type = 'projects',
      page = 1,
      limit = 10,
      // Project filters
      category,
      skills,
      startDate,
      endDate,
      location,
      distance,
      status,
      // Volunteer filters
      minHours,
      maxHours,
      availability
    } = req.query;
    
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Reference models
    const Project = mongoose.model('Project');
    const User = mongoose.model('User');
    
    let query = {};
    let results = [];
    let count = 0;
    
    // Project search
    if (type === 'projects') {
      // Build query for projects
      query = {};
      
      // Filter by category
      if (category) {
        query.category = category;
      }
      
      // Filter by skills
      if (skills) {
        const skillArray = skills.split(',');
        query.skillsRequired = { $in: skillArray };
      }
      
      // Filter by date range
      if (startDate) {
        query.startDate = { $gte: new Date(startDate) };
      }
      
      if (endDate) {
        query.endDate = query.endDate || {};
        query.endDate.$lte = new Date(endDate);
      }
      
      // Filter by status
      if (status) {
        query.status = status;
      } else {
        // Default to active projects
        query.status = 'active';
      }
      
      // Filter by location
      if (location && distance) {
        const [lng, lat] = location.split(',').map(coord => parseFloat(coord));
        query['location.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: parseInt(distance) * 1000 // Convert km to meters
          }
        };
      }
      
      // Execute query
      results = await Project.find(query)
        .select('title shortDescription coverImage category location.city startDate capacity volunteers')
        .sort({ featured: -1, startDate: 1 })
        .skip(skip)
        .limit(limitNumber)
        .populate('coordinator', 'name avatar');
        
      count = await Project.countDocuments(query);
    } 
    // Volunteer search
    else if (type === 'volunteers' && 
            (req.user.role === 'coordinator' || req.user.role === 'admin')) {
      // Build query for volunteers
      query = { role: 'volunteer' };
      
      // Filter by skills
      if (skills) {
        const skillArray = skills.split(',');
        query.skills = { $in: skillArray };
      }
      
      // Filter by hours range
      if (minHours) {
        query.hoursLogged = query.hoursLogged || {};
        query.hoursLogged.$gte = parseInt(minHours);
      }
      
      if (maxHours) {
        query.hoursLogged = query.hoursLogged || {};
        query.hoursLogged.$lte = parseInt(maxHours);
      }
      
      // Filter by availability
      if (availability) {
        const availabilityTypes = availability.split(',');
        const availabilityQuery = {};
        
        availabilityTypes.forEach(type => {
          availabilityQuery[`availability.${type}`] = true;
        });
        
        Object.assign(query, availabilityQuery);
      }
      
      // Filter by location
      if (location && distance) {
        const [lng, lat] = location.split(',').map(coord => parseFloat(coord));
        query['location.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: parseInt(distance) * 1000 // Convert km to meters
          }
        };
      }
      
      // Execute query
      results = await User.find(query)
        .select('name email avatar skills location.city hoursLogged availability')
        .sort({ hoursLogged: -1 })
        .skip(skip)
        .limit(limitNumber);
        
      count = await User.countDocuments(query);
    }
    
    res.status(200).json({
      success: true,
      count,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(count / limitNumber)
      },
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Skill-based matching
// @route   GET /api/search/match/volunteer/:volunteerId
// @access  Private (Admin and Coordinators)
router.get('/match/volunteer/:volunteerId', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    const { limit = 5 } = req.query;
    
    // Reference models
    const User = mongoose.model('User');
    const Project = mongoose.model('Project');
    
    // Get volunteer skills
    const volunteer = await User.findById(req.params.volunteerId).select('skills location');
    
    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }
    
    // Find active projects with skill overlap
    const projects = await Project.find({
      status: 'active',
      skillsRequired: { $in: volunteer.skills }
    }).select('title shortDescription coverImage skillsRequired category location');
    
    // Calculate match scores
    const scoredProjects = projects.map(project => {
      // Count matching skills
      const matchingSkills = project.skillsRequired.filter(skill => 
        volunteer.skills.includes(skill)
      );
      
      // Calculate skill match percentage
      const skillMatchPercentage = project.skillsRequired.length > 0 
        ? (matchingSkills.length / project.skillsRequired.length) * 100 
        : 0;
      
      // Calculate location score if coordinates available
      let distanceScore = 0;
      let distance = null;
      
      if (volunteer.location?.coordinates && 
          volunteer.location.coordinates.length === 2 &&
          project.location?.coordinates && 
          project.location.coordinates.length === 2) {
        
        // Calculate distance using the Haversine formula
        const volunteerCoords = volunteer.location.coordinates;
        const projectCoords = project.location.coordinates;
        
        // Calculate distance in km
        distance = calculateDistance(
          volunteerCoords[1], volunteerCoords[0],
          projectCoords[1], projectCoords[0]
        );
        
        // Score based on distance (closer = higher score)
        distanceScore = distance <= 5 ? 100 :
                       distance <= 10 ? 80 :
                       distance <= 20 ? 60 :
                       distance <= 50 ? 40 :
                       distance <= 100 ? 20 : 0;
      }
      
      // Combined score (60% skills, 40% location)
      const overallScore = distance !== null 
        ? (skillMatchPercentage * 0.6) + (distanceScore * 0.4)
        : skillMatchPercentage;
      
      return {
        project,
        matchData: {
          skillMatchPercentage: Math.round(skillMatchPercentage),
          matchingSkills,
          distance,
          overallScore: Math.round(overallScore)
        }
      };
    });
    
    // Sort by overall score and return top matches
    scoredProjects.sort((a, b) => b.matchData.overallScore - a.matchData.overallScore);
    
    res.status(200).json({
      success: true,
      data: scoredProjects.slice(0, parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Find volunteers for a project
// @route   GET /api/search/match/project/:projectId
// @access  Private (Admin and Coordinators)
router.get('/match/project/:projectId', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    const { limit = 10 } = req.query;
    
    // Reference models
    const User = mongoose.model('User');
    const Project = mongoose.model('Project');
    
    // Get project skills and location
    const project = await Project.findById(req.params.projectId).select('skillsRequired location');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Find volunteers with skill overlap
    const volunteers = await User.find({
      role: 'volunteer',
      skills: { $in: project.skillsRequired }
    }).select('name avatar skills location.coordinates hoursLogged');
    
    // Calculate match scores
    const scoredVolunteers = volunteers.map(volunteer => {
      // Count matching skills
      const matchingSkills = volunteer.skills.filter(skill => 
        project.skillsRequired.includes(skill)
      );
      
      // Calculate skill match percentage
      const skillMatchPercentage = project.skillsRequired.length > 0 
        ? (matchingSkills.length / project.skillsRequired.length) * 100 
        : 0;
      
      // Calculate location score if coordinates available
      let distanceScore = 0;
      let distance = null;
      
      if (volunteer.location?.coordinates && 
          volunteer.location.coordinates.length === 2 &&
          project.location?.coordinates && 
          project.location.coordinates.length === 2) {
        
        // Calculate distance using the Haversine formula
        const volunteerCoords = volunteer.location.coordinates;
        const projectCoords = project.location.coordinates;
        
        // Calculate distance in km
        distance = calculateDistance(
          volunteerCoords[1], volunteerCoords[0],
          projectCoords[1], projectCoords[0]
        );
        
        // Score based on distance (closer = higher score)
        distanceScore = distance <= 5 ? 100 :
                       distance <= 10 ? 80 :
                       distance <= 20 ? 60 :
                       distance <= 50 ? 40 :
                       distance <= 100 ? 20 : 0;
      }
      
      // Experience score based on hours logged
      const experienceScore = volunteer.hoursLogged >= 100 ? 100 :
                             volunteer.hoursLogged >= 50 ? 75 :
                             volunteer.hoursLogged >= 20 ? 50 :
                             volunteer.hoursLogged >= 5 ? 25 : 0;
      
      // Combined score (50% skills, 30% location, 20% experience)
      const overallScore = distance !== null 
        ? (skillMatchPercentage * 0.5) + (distanceScore * 0.3) + (experienceScore * 0.2)
        : (skillMatchPercentage * 0.7) + (experienceScore * 0.3);
      
      return {
        volunteer,
        matchData: {
          skillMatchPercentage: Math.round(skillMatchPercentage),
          matchingSkills,
          distance,
          experienceScore,
          overallScore: Math.round(overallScore)
        }
      };
    });
    
    // Sort by overall score and return top matches
    scoredVolunteers.sort((a, b) => b.matchData.overallScore - a.matchData.overallScore);
    
    res.status(200).json({
      success: true,
      data: scoredVolunteers.slice(0, parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to calculate distance between two points using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

module.exports = router;
