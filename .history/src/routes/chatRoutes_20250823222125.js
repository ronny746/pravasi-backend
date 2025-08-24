// routes/chatRoutes.js
const express = require('express');
const ChatController = require('../controllers/chatController');

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Chat API is working!', 
    timestamp: new Date(),
    endpoints: {
      'GET /api/chat/history': 'Get chat history between two users',
      'GET /api/chat/list/:userId': 'Get user chat list',
      'GET /api/chat/online-users': 'Get online users',
      'POST /api/chat/room': 'Generate room ID',
      'POST /api/chat/mark-read': 'Mark messages as read',
      'GET /api/chat/search': 'Search messages',
      'DELETE /api/chat/message/:messageId': 'Delete message'
    }
  });
});

// Chat history route
// GET /api/chat/history?senderId=user1&receiverId=user2&page=1&limit=50
router.get('/history', ChatController.getChatHistory);

// Get user's chat list
// GET /api/chat/list/user123
router.get('/list/:userId', ChatController.getChatList);

// Get online users
// GET /api/chat/online-users
router.get('/online-users', ChatController.getOnlineUsers);

// Generate room ID for two users
// POST /api/chat/room
// Body: { "userId1": "user1", "userId2": "user2" }
router.post('/room', ChatController.getRoomId);

// Mark messages as read
// POST /api/chat/mark-read
// Body: { "messageIds": ["id1", "id2"] } OR { "userId": "user1", "senderId": "user2" }
router.post('/mark-read', ChatController.markMessagesAsRead);

// Search messages
// GET /api/chat/search?userId=user1&query=hello&page=1&limit=20
router.get('/search', ChatController.searchMessages);

// Delete message
// DELETE /api/chat/message/messageId123
// Body: { "userId": "user1" }
router.delete('/message/:messageId', ChatController.deleteMessage);

module.exports = router;