// socket/socketHandler.js
const Message = require('../models/Message');
const { User } = require('../models/User');
const ChatController = require('../controllers/chatController');

// Store connected users
const connectedUsers = new Map();

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
            joinTime: new Date()
          });
          
          // Update user status in database
          await User.findOneAndUpdate(
            { userId },
            { 
              username, 
              photoUrl,
              isOnline: true, 
              lastSeen: new Date() 
            },
            { upsert: true }
          );

          // Store user data in socket
          socket.userId = userId;
          socket.username = username;
          
          // Join user to their personal room
          socket.join(`user_${userId}`);
          
          // Notify others about user online status
          socket.broadcast.emit('userOnline', { 
            userId, 
            username, 
            photoUrl,
            timestamp: new Date() 
          });
          
          // Send success response to user
          socket.emit('joinSuccess', {
            userId,
            username,
            socketId: socket.id,
            onlineUsers: Array.from(connectedUsers.values()).map(user => ({
              userId: user.userId,
              username: user.username,
              photoUrl: user.photoUrl
            }))
          });
          
          console.log(`✅ ${username} (${userId}) joined successfully`);
          
        } catch (error) {
          console.error('❌ Error in join event:', error);
          socket.emit('error', { message: 'Failed to join' });
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
            roomId
          });
          
        } catch (error) {
          console.error('❌ Error joining room:', error);
          socket.emit('error', { message: 'Failed to join room' });
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
            fileName = null 
          } = data;
          
          // Validation
          if (!senderId || !receiverId || !message) {
            socket.emit('messageError', { 
              error: 'SenderId, receiverId, and message are required' 
            });
            return;
          }
          
          // Generate room ID
          const roomId = ChatController.generateRoomId(senderId, receiverId);
          
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
              username: socket.username
            }
          });
          
          // Confirm message sent to sender
          socket.emit('messageSent', {
            tempId: data.tempId, // If client sends temp ID
            messageId: savedMessage._id,
            timestamp: savedMessage.timestamp
          });
          
          console.log(`💬 Message: ${senderId} → ${receiverId} in room ${roomId}`);
          
        } catch (error) {
          console.error('❌ Error sending message:', error);
          socket.emit('messageError', { 
            error: 'Failed to send message',
            details: error.message 
          });
        }
      });

      // Handle typing indicators
      socket.on('typing', (data) => {
        try {
          const { roomId, receiverId, isTyping } = data;
          
          if (roomId) {
            // Send typing status to room
            socket.to(roomId).emit('userTyping', { 
              userId: socket.userId,
              username: socket.username,
              isTyping 
            });
          }
          
          if (receiverId) {
            // Send typing status to specific user
            io.to(`user_${receiverId}`).emit('userTyping', {
              userId: socket.userId,
              username: socket.username,
              isTyping
            });
          }
          
        } catch (error) {
          console.error('❌ Error handling typing:', error);
        }
      });

      // Handle message read receipts
      socket.on('messageRead', async (data) => {
        try {
          const { messageId, senderId } = data;
          
          await Message.findByIdAndUpdate(messageId, { isRead: true });
          
          // Notify sender about read receipt
          io.to(`user_${senderId}`).emit('messageReadReceipt', {
            messageId,
            readBy: socket.userId,
            readAt: new Date()
          });
          
        } catch (error) {
          console.error('❌ Error marking message as read:', error);
        }
      });

      // Handle user going offline/online
      socket.on('updateStatus', async (data) => {
        try {
          const { status } = data; // 'online', 'away', 'busy'
          
          if (socket.userId) {
            await User.findOneAndUpdate(
              { userId: socket.userId },
              { 
                status: status || 'online',
                lastSeen: new Date() 
              }
            );
            
            // Broadcast status change
            socket.broadcast.emit('userStatusChanged', {
              userId: socket.userId,
              status,
              lastSeen: new Date()
            });
          }
          
        } catch (error) {
          console.error('❌ Error updating status:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        try {
          if (socket.userId) {
            // Update user status in database
            await User.findOneAndUpdate(
              { userId: socket.userId },
              { 
                isOnline: false, 
                lastSeen: new Date() 
              }
            );
            
            // Notify others about user going offline
            socket.broadcast.emit('userOffline', { 
              userId: socket.userId,
              username: socket.username,
              lastSeen: new Date()
            });
            
            // Remove from connected users
            connectedUsers.delete(socket.id);
            
            console.log(`🔴 ${socket.username} (${socket.userId}) disconnected`);
          } else {
            console.log('🔴 Unknown client disconnected:', socket.id);
          }
          
        } catch (error) {
          console.error('❌ Error handling disconnect:', error);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });
    });
  }

  // Get connected users count
  static getConnectedUsersCount() {
    return connectedUsers.size;
  }

  // Get connected users list
  static getConnectedUsersList() {
    return Array.from(connectedUsers.values());
  }
}

module.exports = { SocketHandler, connectedUsers };