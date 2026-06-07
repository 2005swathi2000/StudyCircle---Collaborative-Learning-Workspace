const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Helper to sign JWT
const signToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'super_secret_study_circle_token_2026_key_ap_telangana',
    { expiresIn: '7d' }
  );
};

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { fullName, username, password, role } = req.body;

    if (!fullName || !username || !password) {
      return res.status(400).json({ error: 'All fields (fullName, username, password) are required.' });
    }

    const normalizedUsername = username.trim().toLowerCase();

    // Role check: Group Admin -> admin, Student -> student
    const validRole = (role === 'admin' || role === 'student') ? role : 'student';

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username: normalizedUsername } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    // Create user
    const newUser = await User.create({
      fullName,
      username: normalizedUsername,
      password,
      role: validRole
    });

    const token = signToken(newUser);

    return res.status(201).json({
      message: 'Registration successful!',
      token,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const normalizedUsername = username.trim().toLowerCase();

    const user = await User.findOne({ where: { username: normalizedUsername } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const token = signToken(user);

    return res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        streakCount: user.streakCount,
        totalStudyHours: user.totalStudyHours
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// Reset Password Route (Simulated recovery using recoveryPin)
router.post('/reset-password', async (req, res) => {
  try {
    const { username, newPassword, recoveryPin } = req.body;

    if (!username || !newPassword || !recoveryPin) {
      return res.status(400).json({ error: 'Username, new password, and recovery PIN are required.' });
    }

    // Default simulation recovery PIN check
    if (recoveryPin !== '2026') {
      return res.status(400).json({ error: 'Invalid recovery PIN. Use default code 2026.' });
    }

    const normalizedUsername = username.trim().toLowerCase();

    const user = await User.findOne({ where: { username: normalizedUsername } });
    if (!user) {
      return res.status(404).json({ error: 'Username not found.' });
    }

    // Update password (hooks in User model will automatically hash this password)
    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password reset successful!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error during password reset.' });
  }
});

// Get current user profile (Me)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error retrieving user profile.' });
  }
});

module.exports = router;
