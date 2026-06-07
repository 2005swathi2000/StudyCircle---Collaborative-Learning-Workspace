const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DiscussionTopic = sequelize.define('DiscussionTopic', {
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
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false
  }
});

module.exports = DiscussionTopic;
