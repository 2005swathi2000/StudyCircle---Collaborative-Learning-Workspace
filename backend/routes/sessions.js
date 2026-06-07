const express = require('express');
const { Session, GroupMember, User } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Schedule a new study session
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { groupId, title, description, scheduledAt, durationMinutes, meetingLink } = req.body;

    if (!groupId || !title || !scheduledAt) {
      return res.status(400).json({ error: 'groupId, title, and scheduledAt are required.' });
    }

    // Verify user is a member of the group
    const member = await GroupMember.findOne({
      where: { userId: req.user.id, groupId }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this study group.' });
    }

    const session = await Session.create({
      groupId,
      title,
      description,
      scheduledAt,
      durationMinutes: durationMinutes || 60,
      meetingLink,
      createdBy: req.user.id
    });

    return res.status(201).json({
      message: 'Study session scheduled successfully!',
      session
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error scheduling study session.' });
  }
});

// List all study sessions for a group
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

    const sessions = await Session.findAll({
      where: { groupId },
      include: [
        { model: User, as: 'Creator', attributes: ['id', 'fullName', 'username'] }
      ],
      order: [['scheduledAt', 'ASC']]
    });

    return res.json({ sessions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error fetching study sessions.' });
  }
});

// Update session status (e.g. going live, completed, cancelled)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['upcoming', 'live', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status type.' });
    }

    const session = await Session.findByPk(id);
    if (!session) {
      return res.status(404).json({ error: 'Study session not found.' });
    }

    // Verify membership and role (Only creators or group admins can change status)
    const member = await GroupMember.findOne({
      where: { userId: req.user.id, groupId: session.groupId }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this group.' });
    }

    const isCreator = session.createdBy === req.user.id;
    const isAdmin = member.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Access denied. Only the host or a group admin can update session status.' });
    }

    session.status = status;
    await session.save();

    return res.json({
      message: `Session status updated to ${status}!`,
      session
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error updating session status.' });
  }
});

module.exports = router;
