// controllers/chatController.js
const Message = require('../models/Message');
const User = require('../models/user.model');

// Standardized response helper
const sendResponse = (res, success, message, data = null, statusCode = 200) => {
  return res.status(200).json({
    success,
    message,
    data,
    statusCode
  });
};

class ChatController {

  // Get chat history between two users
  static async getChatHistory(req, res) {
    try {
      const { senderId, receiverId, page = 1, limit = 50 } = req.query;

      if (!senderId || !receiverId) {
        return sendResponse(res, false, 'SenderId and receiverId are required', null, 400);
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

      if (!messages || messages.length === 0) {
        return sendResponse(res, false, 'No chat history found between these users', {
          messages: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        }, 404);
      }

      return sendResponse(res, true, 'Chat history fetched successfully', {
        messages: messages.reverse(),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalMessages,
          totalPages: Math.ceil(totalMessages / limit)
        }
      }, 200);

    } catch (error) {
      console.error('Error fetching chat history:', error);
      return sendResponse(res, false, 'Internal server error occurred while fetching chat history. Please check your network connection and try again.', null, 500);
    }
  }

  // Get user's chat list with last messages
  static async getChatList(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return sendResponse(res, false, 'User ID is required', null, 400);
      }

      // Validate user existence
      const userExists = await User.findById(userId);
      if (!userExists) {
        return sendResponse(res, false, 'User not found. Please check the user ID and try again.', null, 404);
      }

      const chatList = await Message.aggregate([
        // Step 1: match messages where user is sender or receiver
        {
          $match: {
            $or: [{ senderId: userId }, { receiverId: userId }]
          }
        },
        // Step 2: sort by timestamp descending
        { $sort: { timestamp: -1 } },
        // Step 3: group by chat partner
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
        // Step 4: lookup user info
        {
          $lookup: {
            from: 'users',
            let: { partnerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', { $toObjectId: '$$partnerId' }] }
                }
              },
              {
                $project: {
                  _id: 1,
                  name: { $ifNull: ['$nameEn', { $ifNull: ['$nameHi', ''] }] },
                  hindiName: 1,
                  photoUrl: 1,
                  email: 1,
                  phone: 1,
                  deviceToken: 1
                }
              }
            ],
            as: 'userInfo'
          }
        },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        // Step 5: merge user info into lastMessage
        {
          $project: {
            _id: 1,
            lastMessage: {
              $mergeObjects: [
                '$lastMessage',
                {
                  userId: { $toString: '$userInfo._id' },
                  name: '$userInfo.name',
                  hindiName:'$userInfo.h',
                  photoUrl: '$userInfo.photoUrl',
                  email: '$userInfo.email',
                  phone: '$userInfo.phone',
                  deviceToken: '$userInfo.deviceToken'
                }
              ]
            },
            unreadCount: 1
          }
        },
        // Step 6: final sort
        { $sort: { 'lastMessage.timestamp': -1 } }
      ]);

      if (!chatList || chatList.length === 0) {
        return sendResponse(res, true, 'Chat list fetched successfully', [], 200);
      }

      return sendResponse(res, true, 'Chat list fetched successfully', chatList, 200);
    } catch (error) {
      console.error('Error fetching chat list:', error);
      return sendResponse(
        res,
        false,
        'Internal server error occurred while fetching chat list. Please try again later.',
        null,
        500
      );
    }
  }


  // Get online users
  static async getOnlineUsers(req, res) {
    try {
      const onlineUsers = await User.find({ isOnline: true })
        .select('userId username photoUrl isOnline lastSeen');

      if (!onlineUsers || onlineUsers.length === 0) {
        return sendResponse(res, false, 'No users are currently online', [], 404);
      }

      return sendResponse(res, true, 'Online users fetched successfully', onlineUsers, 200);

    } catch (error) {
      console.error('Error fetching online users:', error);
      return sendResponse(res, false, 'Internal server error occurred while fetching online users. Please check your network connection and try again.', null, 500);
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
        return sendResponse(res, false, 'Either messageIds or userId+senderId are required', null, 400);
      }

      const result = await Message.updateMany(
        updateQuery,
        { isRead: true }
      );

      if (result.modifiedCount === 0) {
        return sendResponse(res, false, 'No messages found to mark as read or messages are already read', {
          modifiedCount: 0
        }, 404);
      }

      return sendResponse(res, true, 'Messages marked as read successfully', {
        modifiedCount: result.modifiedCount
      }, 200);

    } catch (error) {
      console.error('Error marking messages as read:', error);
      return sendResponse(res, false, 'Internal server error occurred while marking messages as read. Please check your network connection and try again.', null, 500);
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
        return sendResponse(res, false, 'Both user IDs are required', null, 400);
      }

      // Check if both users exist
      const user1 = await User.findById(userId1);
      const user2 = await User.findById(userId2);

      if (!user1) {
        return sendResponse(res, false, 'First user not found. Please check the user ID and try again.', null, 404);
      }

      if (!user2) {
        return sendResponse(res, false, 'Second user not found. Please check the user ID and try again.', null, 404);
      }

      const roomId = ChatController.generateRoomId(userId1, userId2);

      return sendResponse(res, true, 'Room ID generated successfully', { roomId }, 200);

    } catch (error) {
      console.error('Error generating room ID:', error);
      return sendResponse(res, false, 'Internal server error occurred while generating room ID. Please check your network connection and try again.', null, 500);
    }
  }

  // Search messages
  static async searchMessages(req, res) {
    try {
      const { userId, query, page = 1, limit = 20 } = req.query;

      if (!userId || !query) {
        return sendResponse(res, false, 'User ID and search query are required', null, 400);
      }

      // Check if user exists
      const userExists = await User.findById(userId);
      if (!userExists) {
        return sendResponse(res, false, 'User not found. Please check the user ID and try again.', null, 404);
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

      if (!messages || messages.length === 0) {
        return sendResponse(res, false, `No messages found matching "${query}"`, {
          messages: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        }, 404);
      }

      return sendResponse(res, true, 'Messages found successfully', {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalResults,
          totalPages: Math.ceil(totalResults / limit)
        }
      }, 200);

    } catch (error) {
      console.error('Error searching messages:', error);
      return sendResponse(res, false, 'Internal server error occurred while searching messages. Please check your network connection and try again.', null, 500);
    }
  }

  // Delete message
  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { userId } = req.body;

      if (!messageId || !userId) {
        return sendResponse(res, false, 'Message ID and User ID are required', null, 400);
      }

      const message = await Message.findOne({
        _id: messageId,
        senderId: userId
      });

      if (!message) {
        return sendResponse(res, false, 'Message not found or you are not authorized to delete it', null, 404);
      }

      await Message.findByIdAndDelete(messageId);

      return sendResponse(res, true, 'Message deleted successfully', null, 200);

    } catch (error) {
      console.error('Error deleting message:', error);
      return sendResponse(res, false, 'Internal server error occurred while deleting message. Please check your network connection and try again.', null, 500);
    }
  }
}

module.exports = ChatController;