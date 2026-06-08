const { sequelize } = require('./models');
const { seedDatabase } = require('./utils/seeder');

(async () => {
  try {
    console.log('Force-syncing SQLite database...');
    await sequelize.sync({ force: true });
    console.log('Database tables cleared and recreated.');
    await seedDatabase();
    console.log('Seeding finished successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to force-seed database:', error);
    process.exit(1);
  }
})();
