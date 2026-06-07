const express = require('express');
const { Note, GroupMember, User } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Fetch all notes in a study group
router.get('/group/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check membership
    const member = await GroupMember.findOne({
      where: { userId: req.user.id, groupId }
    });
    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this study group.' });
    }

    const notes = await Note.findAll({
      where: { groupId },
      include: [
        { model: User, as: 'Creator', attributes: ['id', 'fullName', 'username'] }
      ],
      order: [['updatedAt', 'DESC']]
    });

    return res.json({ notes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while fetching notes.' });
  }
});

// Create a new note in a group
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { groupId, title, content } = req.body;
    if (!groupId || !title) {
      return res.status(400).json({ error: 'groupId and title are required.' });
    }

    // Check membership
    const member = await GroupMember.findOne({
      where: { userId: req.user.id, groupId }
    });
    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this study group.' });
    }

    const newNote = await Note.create({
      groupId,
      title,
      content: content || '',
      createdBy: req.user.id,
      lastEditedBy: req.user.id
    });

    return res.status(201).json({
      message: 'Note created successfully!',
      note: newNote
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while creating note.' });
  }
});

// Update/Collaborate on a note
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isPinned } = req.body;

    const note = await Note.findByPk(id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    // Check membership in the note's group
    const member = await GroupMember.findOne({
      where: { userId: req.user.id, groupId: note.groupId }
    });
    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this note\'s group.' });
    }

    // Update fields
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (isPinned !== undefined) note.isPinned = isPinned;
    note.lastEditedBy = req.user.id;

    await note.save();

    return res.json({
      message: 'Note updated successfully!',
      note
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error updating note.' });
  }
});

// Delete a note
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findByPk(id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    // Check if user is the creator or a Group Admin
    const member = await GroupMember.findOne({
      where: { userId: req.user.id, groupId: note.groupId }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this group.' });
    }

    const isCreator = note.createdBy === req.user.id;
    const isAdmin = member.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Access denied. Only the note creator or a group admin can delete this note.' });
    }

    await note.destroy();

    return res.json({ message: 'Note deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while deleting note.' });
  }
});

module.exports = router;
