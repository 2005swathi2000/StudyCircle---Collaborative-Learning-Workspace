// Map of group ID to active users in that group's study room
// Format: { [groupId]: [{ id, username, fullName, socketId }] }
const activeRooms = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    // Join a study room presence
    socket.on('join-room', ({ groupId, user }) => {
      if (!groupId || !user) return;

      socket.join(groupId);
      socket.groupId = groupId;
      socket.user = user;

      if (!activeRooms[groupId]) {
        activeRooms[groupId] = [];
      }

      // Remove existing connection for this user ID if any (prevents duplicates)
      activeRooms[groupId] = activeRooms[groupId].filter(u => u.id !== user.id);

      // Add user to active presence list
      activeRooms[groupId].push({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        socketId: socket.id
      });

      // Broadcast updated list to the room
      io.to(groupId).emit('room-presence-update', activeRooms[groupId]);
    });

    // Leave a study room presence
    socket.on('leave-room', () => {
      const { groupId, user } = socket;
      if (groupId && user && activeRooms[groupId]) {
        activeRooms[groupId] = activeRooms[groupId].filter(u => u.id !== user.id);
        io.to(groupId).emit('room-presence-update', activeRooms[groupId]);
        socket.leave(groupId);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const { groupId, user } = socket;
      if (groupId && user && activeRooms[groupId]) {
        activeRooms[groupId] = activeRooms[groupId].filter(u => u.id !== user.id);
        io.to(groupId).emit('room-presence-update', activeRooms[groupId]);
      }
    });
  });
};
