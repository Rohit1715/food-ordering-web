const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// This code automatically detects if you are running in a deployed environment
// (like Render) or locally. It does this by checking for an environment variable
// called NODE_ENV. On Render, we will set this to 'production'.
const isProduction = process.env.NODE_ENV === 'production';

let dbConfig;

if (isProduction) {
  // --- PRODUCTION CONFIGURATION (TiDB Cloud on Render) ---
  // This block runs ONLY when you are deployed on Render.
  console.log('Running in production mode. Attempting to connect to TiDB Cloud...');
  
  // Check if the required environment variables are set
  if (!process.env.TIDB_HOST || !process.env.TIDB_USER || !process.env.TIDB_PASSWORD) {
    console.error('CRITICAL: TiDB Cloud environment variables are not set. Please check your Render configuration.');
    process.exit(1); // Exit the application if config is missing
  }

  dbConfig = {
    host: process.env.TIDB_HOST,
    port: process.env.TIDB_PORT || 4000,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE || 'test',
    ssl: {
      // This line requires the `ca.pem` file to be in the root of your project.
      ca: fs.readFileSync(path.join(__dirname, 'ca.pem')),
    },
    // Using a connection pool is much better for web applications.
    connectionLimit: 10,
    queueLimit: 0
  };

} else {
  // --- LOCAL DEVELOPMENT CONFIGURATION (XAMPP) ---
  // This block runs when you are on your local computer.
  console.log('Running in development mode. Connecting to local XAMPP MySQL...');
  dbConfig = {
    host: "localhost",
    user: "root",
    password: "",
    port: 3306, // Default XAMPP MySQL port
    database: "foodorderwebsitedb",
  };
}

// Create a connection pool. This is more efficient than a single connection.
const pool = mysql.createPool(dbConfig);

// Test the connection when the application starts
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err);
    // Provide a helpful error if the certificate file is missing in production
    if (isProduction && err.code === 'ENOENT') {
        console.error('--> IMPORTANT: `ca.pem` file not found. Make sure it is in the root directory of your project and has been pushed to your repository.');
    }
    return;
  }
  console.log('Database connected successfully!');
  connection.release(); // Return the connection to the pool
});

// Export the promise-based pool for modern async/await syntax in your routes.
// This is a small upgrade from your previous setup and is better practice.
module.exports = pool.promise();

