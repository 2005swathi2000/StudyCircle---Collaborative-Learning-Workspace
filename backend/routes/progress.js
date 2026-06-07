const express = require('express');
const { Progress, User, GroupMember } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Helper to get formatted dates in local time
const getFormattedDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Log study minutes & activities
router.post('/log', authMiddleware, async (req, res) => {
  try {
    const { studyMinutes, notesCreated, tasksCompleted, groupId } = req.body;
    const userId = req.user.id;

    const mins = parseInt(studyMinutes) || 0;
    const notes = parseInt(notesCreated) || 0;
    const tasks = parseInt(tasksCompleted) || 0;

    if (mins <= 0 && notes <= 0 && tasks <= 0) {
      return res.status(400).json({ error: 'At least one progress metric (minutes, notes, tasks) must be greater than zero.' });
    }

    const todayDateStr = getFormattedDate(new Date());

    // Fetch user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if progress already exists for today
    let progress = await Progress.findOne({
      where: { userId, loggedDate: todayDateStr, groupId: groupId || null }
    });

    if (progress) {
      // Update existing record
      progress.studyMinutes += mins;
      progress.notesCreated += notes;
      progress.tasksCompleted += tasks;
      await progress.save();
    } else {
      // Create new progress record
      progress = await Progress.create({
        userId,
        groupId: groupId || null,
        studyMinutes: mins,
        notesCreated: notes,
        tasksCompleted: tasks,
        loggedDate: todayDateStr
      });

      // Update User Streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDateStr = getFormattedDate(yesterday);

      // Check if user has progress logged yesterday (in any group/self-study)
      const yesterdayLog = await Progress.findOne({
        where: { userId, loggedDate: yesterdayDateStr }
      });

      if (yesterdayLog) {
        // Increment streak
        user.streakCount += 1;
      } else {
        // If they had logged in the past but missed yesterday, reset streak to 1.
        // Otherwise, if they never logged, set it to 1.
        user.streakCount = 1;
      }
    }

    // Accumulate total study hours for the user profile
    if (mins > 0) {
      user.totalStudyHours += (mins / 60.0);
    }
    await user.save();

    return res.status(201).json({
      message: 'Progress logged successfully!',
      progress,
      user: {
        id: user.id,
        streakCount: user.streakCount,
        totalStudyHours: parseFloat(user.totalStudyHours.toFixed(2))
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while logging progress.' });
  }
});

// Get personal stats & progress logs
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'fullName', 'username', 'streakCount', 'totalStudyHours']
    });

    const logs = await Progress.findAll({
      where: { userId },
      order: [['loggedDate', 'DESC']],
      limit: 30 // Last 30 logs
    });

    return res.json({
      streakCount: user.streakCount,
      totalStudyHours: parseFloat(user.totalStudyHours.toFixed(2)),
      logs
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error retrieving stats.' });
  }
});

// Group Leaderboard (Rank members by total study minutes logged in a specific group)
router.get('/group/:groupId/leaderboard', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Verify membership
    const member = await GroupMember.findOne({
      where: { userId: req.user.id, groupId }
    });
    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this group.' });
    }

    // Get all members of the group
    const groupMembers = await GroupMember.findAll({
      where: { groupId },
      include: [{ model: User, attributes: ['id', 'fullName', 'username'] }]
    });

    const leaderboard = [];

    for (const gm of groupMembers) {
      // Sum the study minutes for this user in this group
      const totalMins = await Progress.sum('studyMinutes', {
        where: { userId: gm.userId, groupId }
      }) || 0;

      leaderboard.push({
        userId: gm.userId,
        fullName: gm.User ? gm.User.fullName : 'Unknown User',
        username: gm.User ? gm.User.username : 'unknown',
        role: gm.role,
        totalStudyHours: parseFloat((totalMins / 60.0).toFixed(2)),
        totalStudyMinutes: totalMins
      });
    }

    // Sort descending by minutes
    leaderboard.sort((a, b) => b.totalStudyMinutes - a.totalStudyMinutes);

    return res.json({ leaderboard });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error fetching leaderboard.' });
  }
});

// Get all progress logs in a group (activity feed / accountability logs)
router.get('/group/:groupId/logs', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Verify membership
    const member = await GroupMember.findOne({
      where: { userId: req.user.id, groupId }
    });
    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this group.' });
    }

    const logs = await Progress.findAll({
      where: { groupId },
      include: [{ model: User, attributes: ['id', 'fullName', 'username'] }],
      order: [['loggedDate', 'DESC'], ['createdAt', 'DESC']],
      limit: 50
    });

    return res.json({ logs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error retrieving group activity logs.' });
  }
});

module.exports = router;
