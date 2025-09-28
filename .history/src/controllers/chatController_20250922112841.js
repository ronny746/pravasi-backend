// controllers/chatController.js
const Message = require('../models/Message');
const User = require('../models/user.model');
const { v4: uuidv4 } = require("uuid");

// Get chat history between two users
exports.getChatHistory = async (req, res) => {
  try {
    const { senderId, receiverId, page = 1, limit = 50 } = req.query;

    if (!senderId || !receiverId) {
      return res.status(400).json({ 
        success: false, 
        error: 'SenderId and receiverId are required' 
      });
    }

    const skip = (page - 1) * limit;
    const roomId = generateRoomId(senderId, receiverId);

    const messages = await Message.find({ roomId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalMessages = await Message.countDocuments({ roomId });

    if (!messages || messages.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No chat history found between these users',
        data: {
          messages: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        }
      });
    }

    res.json({
      success: true,
      message: 'Chat history fetched successfully',
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
    res.status(500).json({ 
      error: 'Failed to fetch chat history', 
      details: error.message 
    });
  }
};

// Get user's chat list with last messages
exports.getChatList = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const chatList = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }]
        }
      },
      { $sort: { timestamp: -1 } },
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
                nameHi: 1,
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
      {
        $project: {
          _id: 1,
          lastMessage: {
            $mergeObjects: [
              '$lastMessage',
              {
                userId: { $toString: '$userInfo._id' },
                name: '$userInfo.name',
                hindiName: '$userInfo.nameHi',
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
      { $sort: { 'lastMessage.timestamp': -1 } }
    ]);

    res.json({
      success: true,
      message: 'Chat list fetched successfully',
      chatList
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch chat list', 
      details: error.message 
    });
  }
};

// Send a message (with file upload support)
exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message, messageType = 'text' } = req.body;
    const file = req.file;

    if (!senderId || !receiverId) {
      return res.status(400).json({ 
        success: false, 
        error: 'SenderId and receiverId are required' 
      });
    }

    if (!message && !file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Either message or file is required' 
      });
    }

    const roomId = generateRoomId(senderId, receiverId);
    let fileUrl = null;
    let fileName = null;

    // Handle file upload if present
    // if (file) {
    //   const fileId = uuidv4();
    //   const fileUpload = bucket.file(`messages/${fileId}-${file.originalname}`);
    //   await fileUpload.save(file.buffer, { contentType: file.mimetype });

    //   [fileUrl] = await fileUpload.getSignedUrl({ 
    //     action: "read", 
    //     expires: "01-01-2030" 
    //   });
    //   fileName = file.originalname;
    // }

    const newMessage = new Message({
      senderId,
      receiverId,
      message: message || '',
      messageType,
      roomId,
      fileUrl,
      fileName
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to send message', 
      details: error.message 
    });
  }
};

// Get online users
exports.getOnlineUsers = async (req, res) => {
  try {
    const onlineUsers = await User.find({ isOnline: true })
      .select('username photoUrl isOnline lastSeen');

    res.json({
      success: true,
      message: 'Online users fetched successfully',
      onlineUsers
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch online users', 
      details: error.message 
    });
  }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
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

    const result = await Message.updateMany(updateQuery, { isRead: true });

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'No messages found to mark as read or messages are already read'
      });
    }

    res.json({
      success: true,
      message: 'Messages marked as read successfully',
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to mark messages as read', 
      details: error.message 
    });
  }
};

// Get room ID
exports.getRoomId = async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;

    if (!userId1 || !userId2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both user IDs are required' 
      });
    }

    const user1 = await User.findById(userId1);
    const user2 = await User.findById(userId2);

    if (!user1) {
      return res.status(404).json({ 
        success: false, 
        error: 'First user not found' 
      });
    }

    if (!user2) {
      return res.status(404).json({ 
        success: false, 
        error: 'Second user not found' 
      });
    }

    const roomId = generateRoomId(userId1, userId2);

    res.json({
      success: true,
      message: 'Room ID generated successfully',
      roomId
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to generate room ID', 
      details: error.message 
    });
  }
};

// Search messages
exports.searchMessages = async (req, res) => {
  try {
    const { userId, query, page = 1, limit = 20 } = req.query;

    if (!userId || !query) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID and search query are required' 
      });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
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

    if (!messages || messages.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No messages found matching "${query}"`,
        data: {
          messages: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        }
      });
    }

    res.json({
      success: true,
      message: 'Messages found successfully',
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
    res.status(500).json({ 
      error: 'Failed to search messages', 
      details: error.message 
    });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
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
    res.status(500).json({ 
      error: 'Failed to delete message', 
      details: error.message 
    });
  }
};

// Helper function to generate room ID
const generateRoomId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};