const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Group = sequelize.define('Group', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true
  },
  inviteCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  hooks: {
    beforeValidate: (group) => {
      if (!group.inviteCode) {
        group.inviteCode = Math.random().toString(36).substring(2, 10).toLowerCase();
      }
    }
  }
});

module.exports = Group;
