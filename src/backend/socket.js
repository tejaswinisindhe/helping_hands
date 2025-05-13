
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/userModel');

module.exports = function(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.id})`);
    
    // Join user to their personal room
    socket.join(socket.user._id.toString());
    
    // Handle user joining project rooms
    socket.on('join-project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`${socket.user.name} joined project room: ${projectId}`);
    });
    
    // Handle chat messages
    socket.on('send-message', async (data) => {
      try {
        // Save message to database logic would go here
        
        if (data.projectId) {
          // Project chat
          io.to(`project:${data.projectId}`).emit('receive-message', {
            ...data,
            sender: {
              id: socket.user._id,
              name: socket.user.name,
              avatar: socket.user.avatar
            },
            createdAt: new Date()
          });
        } else if (data.receiverId) {
          // Private chat
          io.to(data.receiverId).emit('receive-message', {
            ...data,
            sender: {
              id: socket.user._id,
              name: socket.user.name,
              avatar: socket.user.avatar
            },
            createdAt: new Date()
          });
          
          // Also emit to sender
          socket.emit('receive-message', {
            ...data,
            sender: {
              id: socket.user._id,
              name: socket.user.name,
              avatar: socket.user.avatar
            },
            createdAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle notifications
    socket.on('notification', (data) => {
      if (data.userId) {
        io.to(data.userId).emit('new-notification', data);
      } else if (data.projectId) {
        io.to(`project:${data.projectId}`).emit('new-notification', data);
      }
    });
    
    // Handle typing indicators
    socket.on('typing', (data) => {
      if (data.projectId) {
        socket.to(`project:${data.projectId}`).emit('user-typing', {
          userId: socket.user._id,
          userName: socket.user.name,
          typing: data.typing
        });
      } else if (data.receiverId) {
        socket.to(data.receiverId).emit('user-typing', {
          userId: socket.user._id,
          userName: socket.user.name,
          typing: data.typing
        });
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.id})`);
    });
  });
  
  return io;
};
