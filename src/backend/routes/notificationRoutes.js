
const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Create Notification schema directly here
const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: [
        'application_status',
        'new_message',
        'project_update',
        'hours_logged',
        'new_badge',
        'reminder',
        'admin_notification',
        'system'
      ],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    read: {
      type: Boolean,
      default: false
    },
    data: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Create the Notification model
const Notification = mongoose.model('Notification', NotificationSchema);

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const startIndex = (page - 1) * limit;
    
    // Find notifications for the user
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('sender', 'name avatar')
      .populate('project', 'title');
      
    // Count total notifications
    const total = await Notification.countDocuments({ recipient: req.user.id });
    
    // Count unread notifications
    const unread = await Notification.countDocuments({
      recipient: req.user.id,
      read: false
    });
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      unreadCount: unread,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create a notification
// @route   POST /api/notifications
// @access  Private (Admin or Coordinator)
router.post('/', protect, async (req, res, next) => {
  try {
    const { recipientId, type, title, message, projectId, data } = req.body;
    
    if (!recipientId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide recipient, type, title, and message'
      });
    }
    
    // Check if user is admin or coordinator
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({
        success: false,
        message: 'Only admins and coordinators can create notifications'
      });
    }
    
    const notification = await Notification.create({
      recipient: recipientId,
      sender: req.user.id,
      type,
      title,
      message,
      project: projectId,
      data
    });
    
    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name avatar')
      .populate('project', 'title');
    
    res.status(201).json({
      success: true,
      message: 'Notification created',
      data: populatedNotification
    });
    
    // Note: Real-time notification would be handled by socket.io
    
  } catch (error) {
    next(error);
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Check if user is the recipient
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this notification'
      });
    }
    
    notification.read = true;
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user.id,
        read: false
      },
      {
        read: true
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Check if user is the recipient
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }
    
    await notification.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted',
      data: {}
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Send bulk notifications
// @route   POST /api/notifications/bulk
// @access  Private (Admin only)
router.post('/bulk', protect, async (req, res, next) => {
  try {
    const { recipientIds, type, title, message, projectId, data } = req.body;
    
    if (!Array.isArray(recipientIds) || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide recipients array, type, title, and message'
      });
    }
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send bulk notifications'
      });
    }
    
    // Create notifications for each recipient
    const notifications = recipientIds.map(recipientId => ({
      recipient: recipientId,
      sender: req.user.id,
      type,
      title,
      message,
      project: projectId,
      data
    }));
    
    await Notification.insertMany(notifications);
    
    res.status(201).json({
      success: true,
      message: `Bulk notifications sent to ${recipientIds.length} users`,
      data: {
        count: recipientIds.length
      }
    });
    
    // Note: Real-time notification would be handled by socket.io
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
