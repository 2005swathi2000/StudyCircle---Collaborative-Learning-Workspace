const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Note = sequelize.define('Note', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false
  },
  lastEditedBy: {
    type: DataTypes.UUID,
    allowNull: true
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Note;
