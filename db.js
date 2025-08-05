const mysql = require('mysql2');

// Use Railway environment variables for database connection
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST || process.env.DB_HOST || "localhost",
  user: process.env.MYSQL_USER || process.env.DB_USER || "root",
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || "",
  port: process.env.MYSQL_PORT || process.env.DB_PORT || 27052, // Railway uses 27052, local XAMPP uses 3307
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || "foodorderingwesitedb", // Use foodorderingwesitedb as default
});

connection.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
  } else {
    console.log('MYSQL connected successfully');
  }
});

module.exports = connection;
