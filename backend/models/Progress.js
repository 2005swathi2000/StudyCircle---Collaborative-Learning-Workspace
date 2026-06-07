const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Progress = sequelize.define('Progress', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: true // Can be null if it's general self-study
  },
  studyMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  notesCreated: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tasksCompleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  loggedDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Progress;
