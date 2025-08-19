const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // Map user IDs to their socket IDs
    this.socketUsers = new Map(); // Map socket IDs to user IDs
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          throw new Error('No authentication token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-passwordHash');
        
        if (!user) {
          throw new Error('User not found');
        }

        socket.userId = user._id.toString();
        socket.user = user;
        
        console.log(`🔌 Socket authentication successful for user: ${user.email}`);
        next();
      } catch (error) {
        console.error('❌ Socket authentication failed:', error.message);
        next(new Error('Authentication failed'));
      }
    });

    // Connection event handlers
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('✅ Socket.IO server initialized');
  }

  handleConnection(socket) {
    const userId = socket.userId;
    console.log(`🔗 User connected: ${socket.user.email} (${userId})`);

    // Store user-socket mapping
    this.userSockets.set(userId, socket.id);
    this.socketUsers.set(socket.id, userId);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to AI Marketing Campaign Generator',
      userId: userId,
      timestamp: new Date().toISOString()
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${socket.user.email} (Reason: ${reason})`);
      this.userSockets.delete(userId);
      this.socketUsers.delete(socket.id);
    });

    // Handle joining campaign room
    socket.on('join:campaign', (data) => {
      const { campaignId } = data;
      if (campaignId) {
        socket.join(`campaign:${campaignId}`);
        console.log(`📋 User ${userId} joined campaign room: ${campaignId}`);
        socket.emit('joined:campaign', { campaignId });
      }
    });

    // Handle leaving campaign room
    socket.on('leave:campaign', (data) => {
      const { campaignId } = data;
      if (campaignId) {
        socket.leave(`campaign:${campaignId}`);
        console.log(`📋 User ${userId} left campaign room: ${campaignId}`);
        socket.emit('left:campaign', { campaignId });
      }
    });

    // Handle ping for connection health check
    socket.on('ping', (callback) => {
      if (typeof callback === 'function') {
        callback({
          timestamp: new Date().toISOString(),
          userId: userId
        });
      }
    });

    // Handle requesting job status
    socket.on('job:status', async (data) => {
      const { jobId, queueName } = data;
      try {
        const queueService = require('./queueService');
        const jobStatus = await queueService.getJobStatus(queueName, jobId);
        
        socket.emit('job:status:response', {
          jobId,
          queueName,
          status: jobStatus
        });
      } catch (error) {
        socket.emit('job:status:error', {
          jobId,
          error: error.message
        });
      }
    });

    // Handle requesting campaign updates
    socket.on('campaign:subscribe', (data) => {
      const { campaignId } = data;
      if (campaignId) {
        socket.join(`campaign:${campaignId}:updates`);
        console.log(`📋 User ${userId} subscribed to campaign updates: ${campaignId}`);
      }
    });

    socket.on('campaign:unsubscribe', (data) => {
      const { campaignId } = data;
      if (campaignId) {
        socket.leave(`campaign:${campaignId}:updates`);
        console.log(`📋 User ${userId} unsubscribed from campaign updates: ${campaignId}`);
      }
    });
  }

  // Emit to a specific user
  emitToUser(userId, event, data) {
    if (!this.io) return false;

    const socketId = this.userSockets.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
      console.log(`📤 Emitted "${event}" to user ${userId}`);
      return true;
    }

    console.log(`⚠️  User ${userId} not connected, cannot emit "${event}"`);
    return false;
  }

  // Emit to all users in a room
  emitToRoom(room, event, data) {
    if (!this.io) return false;

    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
    console.log(`📤 Emitted "${event}" to room ${room}`);
    return true;
  }

  // Emit to all users working on a specific campaign
  emitToCampaign(campaignId, event, data) {
    return this.emitToRoom(`campaign:${campaignId}`, event, data);
  }

  // Emit campaign updates to subscribers
  emitCampaignUpdate(campaignId, event, data) {
    return this.emitToRoom(`campaign:${campaignId}:updates`, event, data);
  }

  // Broadcast to all connected users
  broadcast(event, data) {
    if (!this.io) return false;

    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
    console.log(`📢 Broadcasted "${event}" to all users`);
    return true;
  }

  // Get connection statistics
  getStats() {
    if (!this.io) {
      return {
        connected: false,
        connectedUsers: 0,
        totalConnections: 0
      };
    }

    return {
      connected: true,
      connectedUsers: this.userSockets.size,
      totalConnections: this.io.engine.clientsCount,
      userSockets: Array.from(this.userSockets.keys()),
      rooms: Array.from(this.io.sockets.adapter.rooms.keys())
    };
  }

  // Check if a user is connected
  isUserConnected(userId) {
    return this.userSockets.has(userId.toString());
  }

  // Disconnect a specific user
  disconnectUser(userId, reason = 'Server initiated disconnect') {
    const socketId = this.userSockets.get(userId.toString());
    if (socketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(reason);
        console.log(`🔌 Disconnected user ${userId}: ${reason}`);
        return true;
      }
    }
    return false;
  }

  // Send notification to user (with fallback to database if offline)
  async sendNotification(userId, notification) {
    const sent = this.emitToUser(userId, 'notification', notification);
    
    if (!sent) {
      // TODO: Store notification in database for offline users
      console.log(`💾 Storing notification for offline user ${userId}`);
    }
    
    return sent;
  }

  // Cleanup on server shutdown
  close() {
    if (this.io) {
      console.log('🔌 Closing Socket.IO server...');
      this.io.close();
      this.userSockets.clear();
      this.socketUsers.clear();
      console.log('✅ Socket.IO server closed');
    }
  }
}

module.exports = new SocketService();
