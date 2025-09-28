// socket/socketHandler.js
const Message = require('../models/Message');
const User = require('../models/user.model');

// Store connected users with their socket info
const connectedUsers = new Map();
const userSockets = new Map(); // userId -> Set of socketIds (for multiple devices)

class SocketHandler {
  
  static initializeSocket(io) {
    io.on('connection', (socket) => {
      console.log('🔌 New client connected:', socket.id);

      // User joins with their credentials
      socket.on('join', async (data) => {
        try {
          const { userId, username, photoUrl = null } = data;
          
          if (!userId || !username) {
            socket.emit('error', { message: 'UserId and username are required' });
            return;
          }
          
          // Store user info in memory
          connectedUsers.set(socket.id, { 
            userId, 
            username, 
            photoUrl,
            socketId: socket.id,
            joinTime: new Date(),
            lastActivity: new Date()
          });
          
          // Track multiple sockets per user
          if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
          }
          userSockets.get(userId).add(socket.id);
          
          // Update user status in database - Fixed: use _id instead of userId
          await User.findByIdAndUpdate(
            userId,
            { 
              isOnline: true, 
              lastSeen: new Date()
            },
            { new: true }
          );

          // Store user data in socket
          socket.userId = userId;
          socket.username = username;
          socket.photoUrl = photoUrl;
          
          // Join user to their personal room
          socket.join(`user_${userId}`);
          
          // Get all online users
          const onlineUsers = await this.getOnlineUsers();
          
          // Notify others about user coming online (only if this is their first socket)
          if (userSockets.get(userId).size === 1) {
            socket.broadcast.emit('userOnline', { 
              userId, 
              username, 
              photoUrl,
              timestamp: new Date(),
              status: 'online'
            });
            
            console.log(`✅ ${username} (${userId}) came ONLINE`);
          }
          
          // Send success response to user
          socket.emit('joinSuccess', {
            userId,
            username,
            photoUrl,
            socketId: socket.id,
            onlineUsers: onlineUsers,
            totalOnline: onlineUsers.length
          });
          
          // Broadcast updated online users count
          io.emit('onlineUsersCount', {
            count: onlineUsers.length,
            users: onlineUsers
          });
          
          console.log(`✅ ${username} (${userId}) joined successfully (Socket: ${socket.id})`);
          
        } catch (error) {
          console.error('❌ Error in join event:', error);
          socket.emit('error', { message: 'Failed to join' });
        }
      });

      // Explicit online event
      socket.on('goOnline', async () => {
        try {
          if (socket.userId) {
            await User.findByIdAndUpdate(
              socket.userId,
              { 
                isOnline: true,
                lastSeen: new Date()
              }
            );
            
            // Broadcast user online status
            socket.broadcast.emit('userOnline', {
              userId: socket.userId,
              username: socket.username,
              photoUrl: socket.photoUrl,
              timestamp: new Date(),
              status: 'online'
            });
            
            // Update connected users map
            if (connectedUsers.has(socket.id)) {
              connectedUsers.get(socket.id).lastActivity = new Date();
            }
            
            console.log(`🟢 ${socket.username} (${socket.userId}) went ONLINE`);
          }
        } catch (error) {
          console.error('❌ Error in goOnline event:', error);
        }
      });

      // Explicit offline event  
      socket.on('goOffline', async () => {
        try {
          if (socket.userId) {
            await User.findByIdAndUpdate(
              socket.userId,
              { 
                isOnline: false,
                lastSeen: new Date()
              }
            );
            
            // Broadcast user offline status
            socket.broadcast.emit('userOffline', {
              userId: socket.userId,
              username: socket.username,
              photoUrl: socket.photoUrl,
              lastSeen: new Date(),
              status: 'offline'
            });
            
            console.log(`🔴 ${socket.username} (${socket.userId}) went OFFLINE`);
          }
        } catch (error) {
          console.error('❌ Error in goOffline event:', error);
        }
      });

      // Get online users list
      socket.on('getOnlineUsers', async () => {
        try {
          const onlineUsers = await this.getOnlineUsers();
          socket.emit('onlineUsersList', {
            users: onlineUsers,
            count: onlineUsers.length,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('❌ Error getting online users:', error);
          socket.emit('error', { message: 'Failed to get online users' });
        }
      });

      // Join a specific chat room
      socket.on('joinRoom', (data) => {
        try {
          const { roomId } = data;
          
          if (!roomId) {
            socket.emit('error', { message: 'Room ID is required' });
            return;
          }
          
          socket.join(roomId);
          socket.currentRoom = roomId;
          
          console.log(`👥 ${socket.username} joined room: ${roomId}`);
          
          // Notify room about user joining
          socket.to(roomId).emit('userJoinedRoom', {
            userId: socket.userId,
            username: socket.username,
            photoUrl: socket.photoUrl,
            roomId,
            timestamp: new Date()
          });
          
          // Confirm room joined
          socket.emit('roomJoined', {
            roomId,
            timestamp: new Date()
          });
          
        } catch (error) {
          console.error('❌ Error joining room:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Leave a specific chat room
      socket.on('leaveRoom', (data) => {
        try {
          const { roomId } = data || { roomId: socket.currentRoom };
          
          if (roomId) {
            socket.leave(roomId);
            
            // Notify room about user leaving
            socket.to(roomId).emit('userLeftRoom', {
              userId: socket.userId,
              username: socket.username,
              roomId,
              timestamp: new Date()
            });
            
            console.log(`👋 ${socket.username} left room: ${roomId}`);
          }
          
          socket.currentRoom = null;
          
        } catch (error) {
          console.error('❌ Error leaving room:', error);
        }
      });

      // Handle sending messages
      socket.on('sendMessage', async (data) => {
        try {
          const { 
            senderId, 
            receiverId, 
            message, 
            messageType = 'text',
            fileUrl = null,
            fileName = null,
            tempId = null
          } = data;
          
          // Validation
          if (!senderId || !receiverId || !message) {
            socket.emit('messageError', { 
              error: 'SenderId, receiverId, and message are required',
              tempId 
            });
            return;
          }
          
          // Update last activity
          if (connectedUsers.has(socket.id)) {
            connectedUsers.get(socket.id).lastActivity = new Date();
          }
          
          // Generate room ID - Fixed: use helper function
          const roomId = this.generateRoomId(senderId, receiverId);
          
          // Save message to database
          const newMessage = new Message({
            senderId,
            receiverId,
            message,
            messageType,
            roomId,
            fileUrl,
            fileName,
            timestamp: new Date()
          });
          
          const savedMessage = await newMessage.save();
          
          // Prepare message data for emit
          const messageData = {
            _id: savedMessage._id,
            senderId,
            receiverId,
            message,
            messageType,
            roomId,
            fileUrl,
            fileName,
            timestamp: savedMessage.timestamp,
            isRead: false
          };
          
          // Send message to room
          io.to(roomId).emit('receiveMessage', messageData);
          
          // Send to receiver's personal room (if they're not in the chat room)
          io.to(`user_${receiverId}`).emit('newMessage', {
            ...messageData,
            senderInfo: {
              userId: senderId,
              username: socket.username,
              photoUrl: socket.photoUrl
            }
          });
          
          // Confirm message sent to sender
          socket.emit('messageSent', {
            tempId: tempId,
            messageId: savedMessage._id,
            timestamp: savedMessage.timestamp,
            status: 'sent'
          });
          
          console.log(`💬 Message: ${senderId} → ${receiverId} in room ${roomId}`);
          
        } catch (error) {
          console.error('❌ Error sending message:', error);
          socket.emit('messageError', { 
            error: 'Failed to send message',
            details: error.message,
            tempId: data.tempId
          });
        }
      });

      // Handle typing indicators
      socket.on('typing', (data) => {
        try {
          const { roomId, receiverId, isTyping } = data;
          
          // Update last activity
          if (connectedUsers.has(socket.id)) {
            connectedUsers.get(socket.id).lastActivity = new Date();
          }
          
          const typingData = { 
            senderId: socket.userId,
            username: socket.username,
            photoUrl: socket.photoUrl,
            isTyping,
            timestamp: new Date()
          };
          
          if (roomId) {
            // Send typing status to room
            socket.to(roomId).emit('userTyping', typingData);
          }
          
          if (receiverId) {
            // Send typing status to specific user
            io.to(`user_${receiverId}`).emit('userTyping', typingData);
          }
          
        } catch (error) {
          console.error('❌ Error handling typing:', error);
        }
      });

      // Handle message read receipts
      socket.on('messageRead', async (data) => {
        try {
          const { messageId, senderId, messageIds } = data;
          
          if (messageIds && Array.isArray(messageIds)) {
            // Mark multiple messages as read
            await Message.updateMany(
              { _id: { $in: messageIds } },
              { isRead: true, readAt: new Date() }
            );
            
            // Notify sender about read receipts
            io.to(`user_${senderId}`).emit('messagesReadReceipt', {
              messageIds,
              readBy: socket.userId,
              readAt: new Date()
            });
          } else if (messageId) {
            // Mark single message as read
            await Message.findByIdAndUpdate(messageId, { 
              isRead: true,
              readAt: new Date()
            });
            
            // Notify sender about read receipt
            io.to(`user_${senderId}`).emit('messageReadReceipt', {
              messageId,
              readBy: socket.userId,
              readAt: new Date()
            });
          }
          
        } catch (error) {
          console.error('❌ Error marking message as read:', error);
        }
      });

      // Handle heartbeat/ping to keep connection alive
      socket.on('ping', () => {
        try {
          // Update last activity
          if (connectedUsers.has(socket.id)) {
            connectedUsers.get(socket.id).lastActivity = new Date();
          }
          
          socket.emit('pong', { timestamp: new Date() });
        } catch (error) {
          console.error('❌ Error handling ping:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        try {
          if (socket.userId) {
            // Remove socket from user's socket set
            if (userSockets.has(socket.userId)) {
              userSockets.get(socket.userId).delete(socket.id);
              
              // If user has no more sockets, mark as offline
              if (userSockets.get(socket.userId).size === 0) {
                userSockets.delete(socket.userId);
                
                // Update user status in database
                await User.findByIdAndUpdate(
                  socket.userId,
                  { 
                    isOnline: false, 
                    lastSeen: new Date() 
                  }
                );
                
                // Notify others about user going offline
                socket.broadcast.emit('userOffline', { 
                  userId: socket.userId,
                  username: socket.username,
                  photoUrl: socket.photoUrl,
                  lastSeen: new Date(),
                  status: 'offline',
                  timestamp: new Date()
                });
                
                console.log(`🔴 ${socket.username} (${socket.userId}) went OFFLINE (disconnected)`);
                
                // Broadcast updated online users count
                const onlineUsers = await this.getOnlineUsers();
                socket.broadcast.emit('onlineUsersCount', {
                  count: onlineUsers.length,
                  users: onlineUsers
                });
              } else {
                console.log(`🔌 ${socket.username} (${socket.userId}) disconnected (still has other connections)`);
              }
            }
            
            // Remove from connected users
            connectedUsers.delete(socket.id);
            
          } else {
            console.log('🔴 Unknown client disconnected:', socket.id);
            connectedUsers.delete(socket.id);
          }
          
        } catch (error) {
          console.error('❌ Error handling disconnect:', error);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
        socket.emit('errorResponse', {
          message: 'Socket error occurred',
          timestamp: new Date()
        });
      });
    });

    // Cleanup inactive connections every 5 minutes
    setInterval(async () => {
      await this.cleanupInactiveConnections(io);
    }, 5 * 60 * 1000);
  }

  // Get online users from database and connected users - Fixed
  static async getOnlineUsers() {
    try {
      // Get unique user IDs from connected users
      const connectedUserIds = Array.from(new Set(
        Array.from(connectedUsers.values()).map(user => user.userId)
      ));
      
      if (connectedUserIds.length === 0) {
        return [];
      }
      
      // Get user details from database - Fixed: proper query format
      const onlineUsers = await User.find({
        _id: { $in: connectedUserIds }
      }).select('_id nameEn nameHi photoUrl isOnline lastSeen');
      
      return onlineUsers.map(user => ({
        userId: user._id.toString(),
        name: user.nameEn || user.nameHi || 'Unknown',
        nameEn: user.nameEn,
        nameHi: user.nameHi,
        photoUrl: user.photoUrl,
        isOnline: true,
        lastSeen: user.lastSeen,
        status: 'online'
      }));
      
    } catch (error) {
      console.error('❌ Error getting online users:', error);
      return [];
    }
  }

  // Helper function to generate room ID
  static generateRoomId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
  }

  // Get connected users count
  static getConnectedUsersCount() {
    return new Set(Array.from(connectedUsers.values()).map(user => user.userId)).size;
  }

  // Get connected users list
  static getConnectedUsersList() {
    const uniqueUsers = new Map();
    
    Array.from(connectedUsers.values()).forEach(user => {
      if (!uniqueUsers.has(user.userId)) {
        uniqueUsers.set(user.userId, user);
      }
    });
    
    return Array.from(uniqueUsers.values());
  }

  // Cleanup inactive connections
  static async cleanupInactiveConnections(io) {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const inactiveConnections = [];
      
      connectedUsers.forEach((user, socketId) => {
        if (user.lastActivity < fiveMinutesAgo) {
          inactiveConnections.push(socketId);
        }
      });
      
      // Remove inactive connections
      for (const socketId of inactiveConnections) {
        const user = connectedUsers.get(socketId);
        if (user) {
          console.log(`🧹 Cleaning up inactive connection: ${user.username} (${socketId})`);
          
          // Remove from maps
          connectedUsers.delete(socketId);
          if (userSockets.has(user.userId)) {
            userSockets.get(user.userId).delete(socketId);
            if (userSockets.get(user.userId).size === 0) {
              userSockets.delete(user.userId);
              
              // Mark user as offline in database
              await User.findByIdAndUpdate(
                user.userId,
                { 
                  isOnline: false,
                  lastSeen: new Date() 
                }
              );
              
              // Broadcast user offline
              io.emit('userOffline', {
                userId: user.userId,
                username: user.username,
                photoUrl: user.photoUrl,
                lastSeen: new Date(),
                status: 'offline',
                reason: 'inactive'
              });
            }
          }
        }
      }
      
      if (inactiveConnections.length > 0) {
        console.log(`🧹 Cleaned up ${inactiveConnections.length} inactive connections`);
      }
      
    } catch (error) {
      console.error('❌ Error cleaning up inactive connections:', error);
    }
  }

  // Broadcast to all connected users
  static broadcastToAll(io, event, data) {
    io.emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  // Send to specific user (all their devices)
  static sendToUser(io, userId, event, data) {
    io.to(`user_${userId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });
  }
}

module.exports = { SocketHandler, connectedUsers, userSockets };