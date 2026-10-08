const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wishwin_lms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper for testing connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database:', process.env.DB_NAME || 'wishwin_lms');
    connection.release();
    return true;
  } catch (error) {
    console.error('MySQL database connection error:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection,
};
