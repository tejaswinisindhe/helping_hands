
const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Create a Message schema directly here since it's only used by this route
const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    content: {
      type: String,
      required: [true, 'Message content is required']
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: Date
  },
  {
    timestamps: true
  }
);

// Create the Message model
const Message = mongoose.model('Message', MessageSchema);

// @desc    Send a new message
// @route   POST /api/chat/messages
// @access  Private
router.post('/messages', protect, async (req, res, next) => {
  try {
    const { content, receiverId, projectId } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    if (!receiverId && !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Either a receiver or a project must be specified'
      });
    }
    
    const messageData = {
      sender: req.user.id,
      content
    };
    
    if (receiverId) {
      messageData.receiver = receiverId;
    }
    
    if (projectId) {
      messageData.project = projectId;
    }
    
    const message = await Message.create(messageData);
    
    // Populate sender info for response
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .populate('project', 'title');
    
    res.status(201).json({
      success: true,
      data: populatedMessage
    });
    
    // Note: Real-time notification would be handled by socket.io
    
  } catch (error) {
    next(error);
  }
});

// @desc    Get messages for a specific user conversation
// @route   GET /api/chat/messages/user/:userId
// @access  Private
router.get('/messages/user/:userId', protect, async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id }
      ]
    })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: 1 });
      
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
    
    // Mark messages as read
    await Message.updateMany(
      {
        sender: req.params.userId,
        receiver: req.user.id,
        read: false
      },
      {
        read: true,
        readAt: Date.now()
      }
    );
    
  } catch (error) {
    next(error);
  }
});

// @desc    Get messages for a specific project
// @route   GET /api/chat/messages/project/:projectId
// @access  Private
router.get('/messages/project/:projectId', protect, async (req, res, next) => {
  try {
    const messages = await Message.find({
      project: req.params.projectId
    })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });
      
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
    
  } catch (error) {
    next(error);
  }
});

// @desc    Get all conversations for a user
// @route   GET /api/chat/conversations
// @access  Private
router.get('/conversations', protect, async (req, res, next) => {
  try {
    // Get the list of users the current user has messaged with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: mongoose.Types.ObjectId(req.user.id) },
            { receiver: mongoose.Types.ObjectId(req.user.id) }
          ],
          // Only include direct messages
          project: { $exists: false }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', mongoose.Types.ObjectId(req.user.id)] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$content' },
          lastMessageDate: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', mongoose.Types.ObjectId(req.user.id)] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { lastMessageDate: -1 }
      }
    ]);
    
    // Get user details for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const user = await mongoose.model('User')
          .findById(conv._id)
          .select('name avatar');
          
        return {
          user,
          lastMessage: conv.lastMessage,
          lastMessageDate: conv.lastMessageDate,
          unreadCount: conv.unreadCount
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: populatedConversations.length,
      data: populatedConversations
    });
    
  } catch (error) {
    next(error);
  }
});

// @desc    Get project conversations
// @route   GET /api/chat/project-conversations
// @access  Private
router.get('/project-conversations', protect, async (req, res, next) => {
  try {
    // Find projects the user is involved in (as coordinator or volunteer)
    const userProjects = await mongoose.model('Project').find({
      $or: [
        { coordinator: req.user.id },
        { 'volunteers.user': req.user.id }
      ]
    }).select('_id title coverImage');
    
    // For each project, get the latest message and unread count
    const projectConversations = await Promise.all(
      userProjects.map(async (project) => {
        const latestMessage = await Message.findOne({ project: project._id })
          .sort({ createdAt: -1 })
          .populate('sender', 'name avatar');
          
        const unreadCount = await Message.countDocuments({
          project: project._id,
          sender: { $ne: req.user.id },
          read: false
        });
        
        return {
          project,
          lastMessage: latestMessage ? latestMessage.content : null,
          lastMessageDate: latestMessage ? latestMessage.createdAt : null,
          lastSender: latestMessage ? latestMessage.sender : null,
          unreadCount
        };
      })
    );
    
    // Sort by latest message date
    projectConversations.sort((a, b) => {
      if (!a.lastMessageDate) return 1;
      if (!b.lastMessageDate) return -1;
      return b.lastMessageDate - a.lastMessageDate;
    });
    
    res.status(200).json({
      success: true,
      count: projectConversations.length,
      data: projectConversations
    });
    
  } catch (error) {
    next(error);
  }
});

// @desc    Mark messages as read
// @route   PUT /api/chat/messages/:messageId/read
// @access  Private
router.put('/messages/:messageId/read', protect, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user is the receiver
    if (message.receiver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this message as read'
      });
    }
    
    message.read = true;
    message.readAt = Date.now();
    
    await message.save();
    
    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: message
    });
    
  } catch (error) {
    next(error);
  }
});

// @desc    Delete message
// @route   DELETE /api/chat/messages/:messageId
// @access  Private
router.delete('/messages/:messageId', protect, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }
    
    await message.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      data: {}
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
