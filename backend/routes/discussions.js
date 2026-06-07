const express = require('express');
const { DiscussionTopic, DiscussionMessage, GroupMember, User } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Create a new topic in a group
router.post('/topics', authMiddleware, async (req, res) => {
  try {
    const { groupId, title } = req.body;
    if (!groupId || !title) {
      return res.status(400).json({ error: 'groupId and title are required.' });
    }

    // Verify membership
    const member = await GroupMember.findOne({
      where: { userId: req.user.id, groupId }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this study group.' });
    }

    const topic = await DiscussionTopic.create({
      groupId,
      title,
      createdBy: req.user.id
    });

    return res.status(201).json({
      message: 'Discussion topic created successfully!',
      topic
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error creating discussion topic.' });
  }
});

// Get all discussion topics in a group
router.get('/group/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Verify membership
    const member = await GroupMember.findOne({
      where: { userId: req.user.id, groupId }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this study group.' });
    }

    const topics = await DiscussionTopic.findAll({
      where: { groupId },
      include: [
        { model: User, as: 'Creator', attributes: ['id', 'fullName', 'username'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ topics });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error fetching discussion topics.' });
  }
});

// Post a message in a discussion topic
router.post('/topics/:topicId/messages', authMiddleware, async (req, res) => {
  try {
    const { topicId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const topic = await DiscussionTopic.findByPk(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Discussion topic not found.' });
    }

    // Verify membership in the group that the topic belongs to
    const member = await GroupMember.findOne({
      where: { userId: req.user.id, groupId: topic.groupId }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this study group.' });
    }

    const message = await DiscussionMessage.create({
      topicId,
      userId: req.user.id,
      content
    });

    // Fetch the created message with user attributes
    const savedMessage = await DiscussionMessage.findByPk(message.id, {
      include: [{ model: User, attributes: ['id', 'fullName', 'username'] }]
    });

    return res.status(201).json({
      message: 'Message posted successfully!',
      discussionMessage: savedMessage
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error posting message.' });
  }
});

// Fetch all messages in a topic
router.get('/topics/:topicId/messages', authMiddleware, async (req, res) => {
  try {
    const { topicId } = req.params;

    const topic = await DiscussionTopic.findByPk(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Discussion topic not found.' });
    }

    // Verify membership
    const member = await GroupMember.findOne({
      where: { userId: req.user.id, groupId: topic.groupId }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this study group.' });
    }

    const messages = await DiscussionMessage.findAll({
      where: { topicId },
      include: [{ model: User, attributes: ['id', 'fullName', 'username'] }],
      order: [['createdAt', 'ASC']]
    });

    return res.json({ messages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error fetching messages.' });
  }
});

module.exports = router;
