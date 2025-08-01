const mysql = require('mysql');
const fs = require('fs');

console.log('🚀 Starting Railway MySQL Database Import...');
console.log('📊 Connecting to: hopper.proxy.rlwy.net:27052');

// Read the SQL file
const sqlContent = fs.readFileSync('FoodOrderingWebsite.sql', 'utf8');

// Create connection to Railway MySQL
const connection = mysql.createConnection({
  host: 'hopper.proxy.rlwy.net',
  user: 'root',
  password: 'VfEuKPcqmaIiouPKhlvDquHAXnQOeLjs',
  port: 27052,
  database: 'railway',
  multipleStatements: true,
  ssl: false
});

console.log('🔗 Attempting to connect...');

connection.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    console.log('💡 This might be due to network restrictions or authentication issues.');
    console.log('🔄 Try using MySQL Workbench instead:');
    console.log('   - Host: hopper.proxy.rlwy.net');
    console.log('   - Port: 27052');
    console.log('   - Username: root');
    console.log('   - Password: VfEuKPcqmaIiouPKhlvDquHAXnQOeLjs');
    process.exit(1);
  }
  
  console.log('✅ Successfully connected to Railway MySQL!');
  console.log('📝 Starting database import...');
  
  // Execute the SQL file
  connection.query(sqlContent, (err, results) => {
    if (err) {
      console.error('❌ Import failed:', err.message);
      console.error('Error details:', err);
    } else {
      console.log('🎉 Database import successful!');
      console.log('📊 Tables created: admin, menu, order_dispatch, orders, users');
      console.log('✅ Your food ordering website database is ready!');
      console.log('');
      console.log('🎯 Next steps:');
      console.log('1. Go to your Render dashboard');
      console.log('2. Add these environment variables to your web service:');
      console.log('   - MYSQL_HOST = hopper.proxy.rlwy.net');
      console.log('   - MYSQL_USER = root');
      console.log('   - MYSQL_PASSWORD = VfEuKPcqmaIiouPKhlvDquHAXnQOeLjs');
      console.log('   - MYSQL_DATABASE = foodorderingwesitedb');
      console.log('   - MYSQL_PORT = 27052');
      console.log('3. Redeploy your Render service');
    }
    
    connection.end();
  });
}); 