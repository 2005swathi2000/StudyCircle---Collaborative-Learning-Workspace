const express = require('express');
const { Group, GroupMember, User } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Create a Study Group
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, subject, isPublic } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Group name is required.' });
    }

    // Create the group
    const newGroup = await Group.create({
      name,
      description,
      subject,
      isPublic: isPublic !== undefined ? isPublic : true
    });

    // Add creator to GroupMember as admin
    await GroupMember.create({
      userId: req.user.id,
      groupId: newGroup.id,
      role: 'admin' // Creator becomes group admin
    });

    return res.status(201).json({
      message: 'Group created successfully!',
      group: newGroup
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while creating group.' });
  }
});

// Join Group using Invite Code
router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required.' });
    }

    const group = await Group.findOne({ where: { inviteCode: inviteCode.toLowerCase() } });
    if (!group) {
      return res.status(404).json({ error: 'Group not found with this invite code.' });
    }

    // Check if already a member
    const existingMember = await GroupMember.findOne({
      where: { userId: req.user.id, groupId: group.id }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this study group.' });
    }

    // Join group
    await GroupMember.create({
      userId: req.user.id,
      groupId: group.id,
      role: 'student' // Joined members default to student role
    });

    return res.status(200).json({
      message: 'Successfully joined the study group!',
      group
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while joining group.' });
  }
});

// Get all groups current user is part of
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Group,
        through: { attributes: ['role'] }
      }]
    });

    return res.json({ groups: user ? user.Groups : [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error fetching groups.' });
  }
});

// Get members list for a group (For admin dashboard / accountability / listing)
router.get('/:id/members', authMiddleware, async (req, res) => {
  try {
    const groupId = req.params.id;

    // Verify user is a member of this group
    const isMember = await GroupMember.findOne({
      where: { userId: req.user.id, groupId }
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this group.' });
    }

    const members = await GroupMember.findAll({
      where: { groupId },
      include: [{
        model: User,
        attributes: ['id', 'fullName', 'username', 'role', 'streakCount', 'totalStudyHours']
      }]
    });

    return res.json({ members });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error fetching group members.' });
  }
});

module.exports = router;
