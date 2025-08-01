const mysql = require('mysql');

console.log('Testing database connection...');
console.log('Environment variables:');
console.log('MYSQL_HOST:', process.env.MYSQL_HOST || 'not set');
console.log('MYSQL_USER:', process.env.MYSQL_USER || 'not set');
console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE || 'not set');
console.log('MYSQL_PORT:', process.env.MYSQL_PORT || '27052 (Railway default)');

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  port: process.env.MYSQL_PORT || 27052, // Railway uses 27052, local XAMPP uses 3307
  database: process.env.MYSQL_DATABASE || "foodorderingwesitedb",
});

connection.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ MYSQL connected successfully!');
    
    // Test a simple query
    connection.query('SELECT COUNT(*) as count FROM menu', (err, results) => {
      if (err) {
        console.error('❌ Query failed:', err.message);
      } else {
        console.log('✅ Database query successful! Menu items count:', results[0].count);
      }
      connection.end();
    });
  }
}); 