// controllers/chatController.js
const Message = require('../models/Message');
const  User  = require('../models/user.model');

class ChatController {
  
  // Get chat history between two users
  static async getChatHistory(req, res) {
    try {
      const { senderId, receiverId, page = 1, limit = 50 } = req.query;
      
      if (!senderId || !receiverId) {
        return res.status(400).json({ 
          success: false,
          error: 'SenderId and receiverId are required' 
        });
      }

      const skip = (page - 1) * limit;
      
      // Generate room ID
      const roomId = ChatController.generateRoomId(senderId, receiverId);
      
      const messages = await Message.find({ roomId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count for pagination
      const totalMessages = await Message.countDocuments({ roomId });

      res.json({
        success: true,
        data: {
          messages: messages.reverse(),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalMessages,
            totalPages: Math.ceil(totalMessages / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch chat history' 
      });
    }
  }

  // Get user's chat list with last messages
  static async getChatList(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const chatList = await Message.aggregate([
        {
          $match: {
            $or: [{ senderId: userId }, { receiverId: userId }]
          }
        },
        {
          $sort: { timestamp: -1 }
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$senderId', userId] },
                '$receiverId',
                '$senderId'
              ]
            },
            lastMessage: { $first: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [
                  { 
                    $and: [
                      { $eq: ['$receiverId', userId] }, 
                      { $eq: ['$isRead', false] }
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
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'userId',
            as: 'userInfo'
          }
        },
        {
          $unwind: {
            path: '$userInfo',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $sort: { 'lastMessage.timestamp': -1 }
        }
      ]);

      res.json({
        success: true,
        data: chatList
      });

    } catch (error) {
      console.error('Error fetching chat list:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch chat list' 
      });
    }
  }

  // Get online users
  static async getOnlineUsers(req, res) {
    try {
      const onlineUsers = await User.find({ isOnline: true })
        .select('userId username photoUrl isOnline lastSeen');
      
      res.json({
        success: true,
        data: onlineUsers
      });

    } catch (error) {
      console.error('Error fetching online users:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch online users' 
      });
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(req, res) {
    try {
      const { messageIds, userId, senderId } = req.body;
      
      let updateQuery = {};
      
      if (messageIds && messageIds.length > 0) {
        updateQuery._id = { $in: messageIds };
      } else if (userId && senderId) {
        updateQuery.senderId = senderId;
        updateQuery.receiverId = userId;
        updateQuery.isRead = false;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Either messageIds or userId+senderId are required'
        });
      }

      const result = await Message.updateMany(
        updateQuery,
        { isRead: true }
      );

      res.json({
        success: true,
        data: {
          modifiedCount: result.modifiedCount
        }
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to mark messages as read' 
      });
    }
  }

  // Generate room ID for two users
  static generateRoomId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
  }

  // Create or get room ID
  static async getRoomId(req, res) {
    try {
      const { userId1, userId2 } = req.body;
      
      if (!userId1 || !userId2) {
        return res.status(400).json({ 
          success: false,
          error: 'Both user IDs are required' 
        });
      }
      
      const roomId = ChatController.generateRoomId(userId1, userId2);
      
      res.json({ 
        success: true, 
        data: { roomId } 
      });

    } catch (error) {
      console.error('Error generating room ID:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to generate room ID' 
      });
    }
  }

  // Search messages
  static async searchMessages(req, res) {
    try {
      const { userId, query, page = 1, limit = 20 } = req.query;
      
      if (!userId || !query) {
        return res.status(400).json({
          success: false,
          error: 'User ID and search query are required'
        });
      }

      const skip = (page - 1) * limit;
      
      const messages = await Message.find({
        $and: [
          {
            $or: [
              { senderId: userId },
              { receiverId: userId }
            ]
          },
          {
            message: { $regex: query, $options: 'i' }
          }
        ]
      })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

      const totalResults = await Message.countDocuments({
        $and: [
          {
            $or: [
              { senderId: userId },
              { receiverId: userId }
            ]
          },
          {
            message: { $regex: query, $options: 'i' }
          }
        ]
      });

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalResults,
            totalPages: Math.ceil(totalResults / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error searching messages:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to search messages' 
      });
    }
  }

  // Delete message
  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { userId } = req.body;
      
      if (!messageId || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Message ID and User ID are required'
        });
      }

      const message = await Message.findOne({
        _id: messageId,
        senderId: userId
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Message not found or you are not authorized to delete it'
        });
      }

      await Message.findByIdAndDelete(messageId);

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete message' 
      });
    }
  }
}

module.exports = ChatController;