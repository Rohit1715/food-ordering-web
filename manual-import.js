const mysql = require('mysql');

console.log('🚀 Manual Railway MySQL Database Import...');

// Create connection without specifying database first
const connection = mysql.createConnection({
  host: 'hopper.proxy.rlwy.net',
  user: 'root',
  password: 'VfEuKPcqmaIiouPKhlvDquHAXnQOeLjs',
  port: 27052,
  ssl: false
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    console.log('💡 Please use MySQL Workbench instead:');
    console.log('   - Host: hopper.proxy.rlwy.net');
    console.log('   - Port: 27052');
    console.log('   - Username: root');
    console.log('   - Password: VfEuKPcqmaIiouPKhlvDquHAXnQOeLjs');
    process.exit(1);
  }
  
  console.log('✅ Connected to Railway MySQL!');
  console.log('📝 Creating database and tables...');
  
  // Step 1: Create database
  connection.query('CREATE DATABASE IF NOT EXISTS foodorderingwesitedb', (err) => {
    if (err) {
      console.error('❌ Failed to create database:', err.message);
      connection.end();
      return;
    }
    
    console.log('✅ Database created successfully');
    
    // Step 2: Use the database
    connection.query('USE foodorderingwesitedb', (err) => {
      if (err) {
        console.error('❌ Failed to use database:', err.message);
        connection.end();
        return;
      }
      
      console.log('✅ Using foodorderingwesitedb database');
      
      // Step 3: Create tables one by one
      const createTables = [
        `CREATE TABLE IF NOT EXISTS admin (
          admin_id int NOT NULL AUTO_INCREMENT,
          admin_name varchar(45) NOT NULL,
          admin_email varchar(45) NOT NULL,
          admin_password varchar(45) NOT NULL,
          admin_mobile varchar(45) NOT NULL,
          PRIMARY KEY (admin_id)
        )`,
        `CREATE TABLE IF NOT EXISTS menu (
          item_id int NOT NULL AUTO_INCREMENT,
          item_name varchar(45) NOT NULL,
          item_type varchar(45) NOT NULL,
          item_category varchar(45) NOT NULL,
          item_serving varchar(45) NOT NULL,
          item_calories int NOT NULL,
          item_price int NOT NULL,
          item_rating varchar(45) NOT NULL,
          item_img varchar(255) NOT NULL,
          PRIMARY KEY (item_id)
        )`,
        `CREATE TABLE IF NOT EXISTS users (
          user_id int NOT NULL AUTO_INCREMENT,
          user_name varchar(30) NOT NULL,
          user_address varchar(255) NOT NULL,
          user_email varchar(45) NOT NULL,
          user_password varchar(1000) NOT NULL,
          user_mobileno varchar(45) NOT NULL,
          PRIMARY KEY (user_id)
        )`,
        `CREATE TABLE IF NOT EXISTS orders (
          order_id varchar(500) NOT NULL,
          user_id int NOT NULL,
          item_id int NOT NULL,
          quantity int NOT NULL,
          price int NOT NULL,
          datetime datetime NOT NULL,
          PRIMARY KEY (order_id)
        )`,
        `CREATE TABLE IF NOT EXISTS order_dispatch (
          order_id varchar(500) NOT NULL,
          user_id int NOT NULL,
          item_id int NOT NULL,
          quantity int NOT NULL,
          price int NOT NULL,
          datetime datetime NOT NULL,
          PRIMARY KEY (order_id)
        )`
      ];
      
      let tableIndex = 0;
      
      function createNextTable() {
        if (tableIndex >= createTables.length) {
          console.log('✅ All tables created successfully!');
          console.log('🎉 Your database is ready!');
          console.log('');
          console.log('🎯 Next steps:');
          console.log('1. Go to your Render dashboard');
          console.log('2. Add environment variables:');
          console.log('   - MYSQL_HOST = hopper.proxy.rlwy.net');
          console.log('   - MYSQL_USER = root');
          console.log('   - MYSQL_PASSWORD = VfEuKPcqmaIiouPKhlvDquHAXnQOeLjs');
          console.log('   - MYSQL_DATABASE = foodorderingwesitedb');
          console.log('   - MYSQL_PORT = 27052');
          console.log('3. Redeploy your Render service');
          connection.end();
          return;
        }
        
        connection.query(createTables[tableIndex], (err) => {
          if (err) {
            console.error(`❌ Failed to create table ${tableIndex + 1}:`, err.message);
          } else {
            console.log(`✅ Table ${tableIndex + 1} created successfully`);
          }
          tableIndex++;
          createNextTable();
        });
      }
      
      createNextTable();
    });
  });
}); 