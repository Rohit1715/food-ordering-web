const mysql = require('mysql2');

// Detect environment: Railway or Local
const isRailway = process.env.MYSQL_HOST && process.env.MYSQL_PORT;

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST || process.env.DB_HOST || "localhost",
  user: process.env.MYSQL_USER || process.env.DB_USER || "root",
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || "",
  port: isRailway 
    ? process.env.MYSQL_PORT                 // Railway port (e.g., 27052)
    : 3307,                                  // Local MySQL default
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || "foodorderingwesitedb",
});

connection.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
  } else {
    console.log('MySQL connected successfully');
  }
});

module.exports = connection;
