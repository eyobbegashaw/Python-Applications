const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createGroup,
    getGroups,
    joinGroup,
    leaveGroup,
    sendMessage,
    getMessages,
    addReaction,
    createPoll,
    votePoll
} = require('../controllers/chatController');

// Group routes
router.post('/groups', protect, createGroup);
router.get('/groups', getGroups);
router.post('/groups/:groupId/join', protect, joinGroup);
router.post('/groups/:groupId/leave', protect, leaveGroup);

// Chat routes
router.get('/:chatId/messages', protect, getMessages);
router.post('/:chatId/messages', protect, sendMessage);
router.post('/:chatId/messages/:messageId/reactions', protect, addReaction);
router.post('/:chatId/polls', protect, createPoll);
router.post('/:chatId/messages/:messageId/vote', protect, votePoll);

module.exports = router;