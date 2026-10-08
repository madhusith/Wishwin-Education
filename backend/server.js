require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`Wishwin LMS API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server due to database connection error:', error.message);
    process.exit(1);
  }
}

startServer();
