const mysql = require('mysql');

// Debug: Log environment variables
console.log('🔍 Environment Variables Debug:');
console.log('MYSQL_HOST:', process.env.MYSQL_HOST);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('MYSQL_USER:', process.env.MYSQL_USER);
console.log('DB_USER:', process.env.DB_USER);
console.log('MYSQL_PASSWORD:', process.env.MYSQL_PASSWORD ? '***' : 'not set');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'not set');
console.log('MYSQL_PORT:', process.env.MYSQL_PORT);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE);
console.log('DB_NAME:', process.env.DB_NAME);

// Use Railway environment variables for database connection
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST || process.env.DB_HOST || "localhost",
  user: process.env.MYSQL_USER || process.env.DB_USER || "root",
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || "",
  port: process.env.MYSQL_PORT || process.env.DB_PORT || 27052, // Railway uses 27052, local XAMPP uses 3307
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || "foodorderingwesitedb", // Use foodorderingwesitedb as default
});

console.log('🔗 Attempting to connect to:');
console.log('Host:', connection.config.host);
console.log('Port:', connection.config.port);
console.log('Database:', connection.config.database);
console.log('User:', connection.config.user);

connection.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
  } else {
    console.log('MYSQL connected successfully');
  }
});

module.exports = connection;
