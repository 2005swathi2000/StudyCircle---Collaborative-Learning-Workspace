const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'live', 'completed', 'cancelled'),
    defaultValue: 'upcoming'
  },
  meetingLink: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Session;
