const sequelize = require('../config/db');
const User = require('./User');
const Group = require('./Group');
const GroupMember = require('./GroupMember');
const Note = require('./Note');
const Session = require('./Session');
const DiscussionTopic = require('./DiscussionTopic');
const DiscussionMessage = require('./DiscussionMessage');
const Progress = require('./Progress');

// Many-to-Many: User <-> Group via GroupMember
User.belongsToMany(Group, { through: GroupMember, foreignKey: 'userId' });
Group.belongsToMany(User, { through: GroupMember, foreignKey: 'groupId' });

User.hasMany(GroupMember, { foreignKey: 'userId' });
GroupMember.belongsTo(User, { foreignKey: 'userId' });

Group.hasMany(GroupMember, { foreignKey: 'groupId' });
GroupMember.belongsTo(Group, { foreignKey: 'groupId' });

// Group -> Note
Group.hasMany(Note, { foreignKey: 'groupId', onDelete: 'CASCADE' });
Note.belongsTo(Group, { foreignKey: 'groupId' });

// User (Creator) -> Note
User.hasMany(Note, { foreignKey: 'createdBy' });
Note.belongsTo(User, { as: 'Creator', foreignKey: 'createdBy' });

// Group -> Session
Group.hasMany(Session, { foreignKey: 'groupId', onDelete: 'CASCADE' });
Session.belongsTo(Group, { foreignKey: 'groupId' });

// User (Creator) -> Session
User.hasMany(Session, { foreignKey: 'createdBy' });
Session.belongsTo(User, { as: 'Creator', foreignKey: 'createdBy' });

// Group -> DiscussionTopic
Group.hasMany(DiscussionTopic, { foreignKey: 'groupId', onDelete: 'CASCADE' });
DiscussionTopic.belongsTo(Group, { foreignKey: 'groupId' });

// User (Creator) -> DiscussionTopic
User.hasMany(DiscussionTopic, { foreignKey: 'createdBy' });
DiscussionTopic.belongsTo(User, { as: 'Creator', foreignKey: 'createdBy' });

// DiscussionTopic -> DiscussionMessage
DiscussionTopic.hasMany(DiscussionMessage, { foreignKey: 'topicId', onDelete: 'CASCADE' });
DiscussionMessage.belongsTo(DiscussionTopic, { foreignKey: 'topicId' });

// User -> DiscussionMessage
User.hasMany(DiscussionMessage, { foreignKey: 'userId' });
DiscussionMessage.belongsTo(User, { foreignKey: 'userId' });

// User -> Progress
User.hasMany(Progress, { foreignKey: 'userId', onDelete: 'CASCADE' });
Progress.belongsTo(User, { foreignKey: 'userId' });

// Group -> Progress (Optional, to log progress per group)
Group.hasMany(Progress, { foreignKey: 'groupId' });
Progress.belongsTo(Group, { foreignKey: 'groupId' });

module.exports = {
  sequelize,
  User,
  Group,
  GroupMember,
  Note,
  Session,
  DiscussionTopic,
  DiscussionMessage,
  Progress
};
