const mysql = require('mysql');

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  port: 3307,
  database: "foodorderingwesitedb",
});

connection.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
  } else {
    console.log('MYSQL connected');
  }
});

module.exports = connection;
