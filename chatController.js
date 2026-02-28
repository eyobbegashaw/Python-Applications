const { Group, Chat, Message } = require('../models/Chat');
const User = require('../models/User');

// Create a group
const createGroup = async (req, res) => {
    try {
        const { name, description, settings, category, tags } = req.body;
        
        const group = new Group({
            name,
            description,
            createdBy: req.user.id,
            admins: [req.user.id],
            members: [{
                user: req.user.id,
                role: 'admin',
                joinedAt: new Date()
            }],
            settings,
            category,
            tags,
            lastActivity: new Date()
        });
        
        await group.save();
        
        // Create chat for group
        const chat = new Chat({
            group: group._id,
            participants: [req.user.id],
            type: 'group'
        });
        
        await chat.save();
        
        res.status(201).json({
            success: true,
            group,
            chat
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create group'
        });
    }
};

// Get all groups
const getGroups = async (req, res) => {
    try {
        const { category, search } = req.query;
        
        const query = { isActive: true };
        
        if (category) query.category = category;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }
        
        // If user is logged in, check membership status
        if (req.user) {
            const groups = await Group.find(query)
                .populate('createdBy', 'username avatar')
                .populate('members.user', 'username avatar')
                .sort({ lastActivity: -1 });
            
            // Add membership status
            const groupsWithStatus = groups.map(group => {
                const member = group.members.find(m => 
                    m.user._id.toString() === req.user.id
                );
                return {
                    ...group.toObject(),
                    isMember: !!member,
                    memberRole: member?.role,
                    memberCount: group.members.length,
                    pendingRequest: group.pendingRequests.some(
                        r => r.user.toString() === req.user.id
                    )
                };
            });
            
            res.json({
                success: true,
                groups: groupsWithStatus
            });
        } else {
            const groups = await Group.find({ ...query, 'settings.isPrivate': false })
                .populate('createdBy', 'username avatar')
                .sort({ lastActivity: -1 });
            
            res.json({
                success: true,
                groups: groups.map(g => ({
                    ...g.toObject(),
                    memberCount: g.members.length
                }))
            });
        }
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch groups'
        });
    }
};

// Join group
const joinGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        
        const group = await Group.findById(groupId);
        
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }
        
        // Check if already a member
        if (group.members.some(m => m.user.toString() === req.user.id)) {
            return res.status(400).json({
                success: false,
                message: 'Already a member'
            });
        }
        
        // Check if group is private
        if (group.settings.isPrivate) {
            // Add to pending requests
            group.pendingRequests.push({ user: req.user.id });
            await group.save();
            
            return res.json({
                success: true,
                message: 'Join request sent',
                pending: true
            });
        }
        
        // Add to members
        group.members.push({
            user: req.user.id,
            role: 'member',
            joinedAt: new Date()
        });
        
        group.lastActivity = new Date();
        await group.save();
        
        // Add user to chat participants
        const chat = await Chat.findOne({ group: groupId });
        if (chat) {
            chat.participants.push(req.user.id);
            await chat.save();
        }
        
        res.json({
            success: true,
            message: 'Joined group successfully',
            group
        });
    } catch (error) {
        console.error('Error joining group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to join group'
        });
    }
};

// Leave group
const leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        
        const group = await Group.findById(groupId);
        
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }
        
        // Remove from members
        group.members = group.members.filter(
            m => m.user.toString() !== req.user.id
        );
        
        // Remove from admins if was admin
        group.admins = group.admins.filter(
            id => id.toString() !== req.user.id
        );
        
        group.lastActivity = new Date();
        await group.save();
        
        // Remove from chat participants
        const chat = await Chat.findOne({ group: groupId });
        if (chat) {
            chat.participants = chat.participants.filter(
                p => p.toString() !== req.user.id
            );
            await chat.save();
        }
        
        res.json({
            success: true,
            message: 'Left group successfully'
        });
    } catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to leave group'
        });
    }
};

// Send message
const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content, contentType, attachments, quiz, poll, replyTo } = req.body;
        
        const chat = await Chat.findById(chatId);
        
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }
        
        // Check if user is participant
        if (!chat.participants.some(p => p.toString() === req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Not a participant in this chat'
            });
        }
        
        const message = {
            sender: req.user.id,
            content,
            contentType,
            attachments,
            quiz,
            poll,
            replyTo,
            readBy: [{
                user: req.user.id,
                readAt: new Date()
            }],
            reactions: []
        };
        
        chat.messages.push(message);
        chat.lastMessage = chat.messages[chat.messages.length - 1]._id;
        chat.updatedAt = new Date();
        
        // Update unread counts for other participants
        chat.participants.forEach(p => {
            if (p.toString() !== req.user.id) {
                const currentCount = chat.unreadCount.get(p.toString()) || 0;
                chat.unreadCount.set(p.toString(), currentCount + 1);
            }
        });
        
        await chat.save();
        
        // Populate sender info
        const populatedMessage = await Message.findById(
            chat.messages[chat.messages.length - 1]._id
        ).populate('sender', 'username avatar');
        
        res.status(201).json({
            success: true,
            message: populatedMessage
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
};

// Get chat messages
const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { limit = 50, before } = req.query;
        // መጀመሪያ በ Chat ID ፈልግ፣ ካልተገኘ በ Group ID ፈልግ
        let chat = await Chat.findById(chatId);
        
        if (!chat) {
            chat = await Chat.findOne({ group: chatId });
        }
        
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }
        // Filter messages
        let messages = chat.messages.filter(m => !m.isDeleted);
        
        if (before) {
            messages = messages.filter(m => 
                m.createdAt < new Date(before)
            );
        }
        
        messages = messages.slice(-parseInt(limit));
        
        // Mark messages as read
        let updated = false;
        messages.forEach(m => {
            if (!m.readBy.some(r => r.user.toString() === req.user.id)) {
                m.readBy.push({
                    user: req.user.id,
                    readAt: new Date()
                });
                updated = true;
            }
        });
        
        if (updated) {
            chat.unreadCount.set(req.user.id, 0);
            await chat.save();
        }
        
        res.json({
            success: true,
            messages,
            hasMore: chat.messages.length > messages.length
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages'
        });
    }
};

// Add reaction to message
const addReaction = async (req, res) => {
    try {
        const { chatId, messageId } = req.params;
        const { reaction } = req.body;
        
        const chat = await Chat.findById(chatId);
        
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }
        
        const message = chat.messages.id(messageId);
        
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        
        // Remove existing reaction from user
        message.reactions = message.reactions.filter(
            r => r.user.toString() !== req.user.id
        );
        
        // Add new reaction
        message.reactions.push({
            user: req.user.id,
            reaction
        });
        
        await chat.save();
        
        res.json({
            success: true,
            reactions: message.reactions
        });
    } catch (error) {
        console.error('Error adding reaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add reaction'
        });
    }
};

// Create poll in group
const createPoll = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { question, options, duration } = req.body;
        
        const chat = await Chat.findById(chatId);
        
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }
        
        // Check if group allows member polls
        if (chat.group) {
            const group = await Group.findById(chat.group);
            if (!group.settings.allowMemberPolls && 
                !group.admins.includes(req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to create polls'
                });
            }
        }
        
        const poll = {
            question,
            options: options.map(opt => ({
                text: opt,
                votes: []
            })),
            endsAt: new Date(Date.now() + duration * 60 * 1000) // duration in minutes
        };
        
        const message = {
            sender: req.user.id,
            contentType: 'poll',
            poll,
            readBy: [{
                user: req.user.id,
                readAt: new Date()
            }]
        };
        
        chat.messages.push(message);
        chat.lastMessage = chat.messages[chat.messages.length - 1]._id;
        await chat.save();
        
        res.status(201).json({
            success: true,
            message: chat.messages[chat.messages.length - 1]
        });
    } catch (error) {
        console.error('Error creating poll:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create poll'
        });
    }
};

// Vote in poll
const votePoll = async (req, res) => {
    try {
        const { chatId, messageId } = req.params;
        const { optionIndex } = req.body;
        
        const chat = await Chat.findById(chatId);
        
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }
        
        const message = chat.messages.id(messageId);
        
        if (!message || message.contentType !== 'poll') {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }
        
        // Check if poll has ended
        if (message.poll.endsAt && new Date() > new Date(message.poll.endsAt)) {
            return res.status(400).json({
                success: false,
                message: 'Poll has ended'
            });
        }
        
        // Remove previous vote
        message.poll.options.forEach(opt => {
            opt.votes = opt.votes.filter(
                v => v.toString() !== req.user.id
            );
        });
        
        // Add new vote
        if (optionIndex >= 0 && optionIndex < message.poll.options.length) {
            message.poll.options[optionIndex].votes.push(req.user.id);
        }
        
        await chat.save();
        
        res.json({
            success: true,
            poll: message.poll
        });
    } catch (error) {
        console.error('Error voting in poll:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to vote'
        });
    }
};

module.exports = {
    createGroup,
    getGroups,
    joinGroup,
    leaveGroup,
    sendMessage,
    getMessages,
    addReaction,
    createPoll,
    votePoll
};