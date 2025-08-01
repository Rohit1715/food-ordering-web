const mysql = require('mysql');
const fs = require('fs');

// Read the SQL file
const sqlContent = fs.readFileSync('FoodOrderingWebsite.sql', 'utf8');

console.log('📝 Starting database import to Railway MySQL...');

// Create connection using your Railway MySQL details
const connection = mysql.createConnection({
  host: 'hopper.proxy.rlwy.net',
  user: 'root',
  password: 'VfEuKPcqmaIiouPKhlvDquHAXnQOeLjs',
  port: 27052,
  database: 'railway',
  multipleStatements: true, // Allow multiple statements
  authPlugins: {
    mysql_clear_password: () => () => Buffer.from('VfEuKPcqmaIiouPKhlvDquHAXnQOeLjs' + '\0')
  }
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    console.log('🔄 Trying alternative connection method...');
    
    // Try alternative connection method
    const connection2 = mysql.createConnection({
      host: 'hopper.proxy.rlwy.net',
      user: 'root',
      password: 'VfEuKPcqmaIiouPKhlvDquHAXnQOeLjs',
      port: 27052,
      database: 'railway',
      multipleStatements: true,
      ssl: false,
      authPlugins: {
        mysql_native_password: () => () => Buffer.from('VfEuKPcqmaIiouPKhlvDquHAXnQOeLjs' + '\0')
      }
    });
    
    connection2.connect((err2) => {
      if (err2) {
        console.error('❌ Alternative connection also failed:', err2.message);
        console.log('💡 Let\'s try using an online MySQL client instead');
        process.exit(1);
      } else {
        console.log('✅ Connected using alternative method!');
        importDatabase(connection2);
      }
    });
  } else {
    console.log('✅ Connected to Railway MySQL database successfully!');
    console.log('📊 Host: hopper.proxy.rlwy.net:27052');
    importDatabase(connection);
  }
});

function importDatabase(conn) {
  console.log('📝 Starting database import...');
  
  // Execute the SQL file
  conn.query(sqlContent, (err, results) => {
    if (err) {
      console.error('❌ Import failed:', err.message);
      console.error('Error details:', err);
    } else {
      console.log('✅ Database import successful!');
      console.log('📊 Database and tables created successfully');
      console.log('🎉 Your food ordering website database is ready!');
    }
    
    conn.end();
  });
} 