const { User } = require('./models');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log('--- TESTING PASSWORD RESET LOGIC ---');
    // 1. Find or create a test user
    const username = 'test_reset_user';
    let user = await User.findOne({ where: { username } });
    if (!user) {
      user = await User.create({
        fullName: 'Test Reset User',
        username,
        password: 'old_password_123',
        role: 'student'
      });
      console.log('Created test user.');
    }

    console.log('Old hashed password:', user.password);

    // 2. Perform password update similar to reset route
    user.password = 'new_password_abc';
    const isChangedBeforeSave = user.changed('password');
    console.log('Is password changed before save?', isChangedBeforeSave);
    
    await user.save();
    
    console.log('New hashed password:', user.password);
    
    // 3. Verify comparison
    const isOldMatch = await bcrypt.compare('old_password_123', user.password);
    const isNewMatch = await bcrypt.compare('new_password_abc', user.password);
    console.log('Does old password match?', isOldMatch);
    console.log('Does new password match?', isNewMatch);
    
    if (isNewMatch && !isOldMatch) {
      console.log('✅ Hashing and saving logic works perfectly!');
    } else {
      console.log('❌ Hashing failed to update correctly.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error testing:', err);
    process.exit(1);
  }
})();
