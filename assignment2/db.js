const mysql = require('mysql');

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "mydb"
  });

connection.connect(function(err) {
    if (err) throw err;
    console.log("DB Connected!");
    /*Create a table*/
    var sql = "CREATE TABLE IF NOT EXISTS users (id VARCHAR(255),first_name VARCHAR(255) NOT NULL, last_name VARCHAR(255) NOT NULL,  password CHAR(60) NOT NULL, email_address VARCHAR(40) NOT NULL, account_created datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, account_updated datetime NOT NULL DEFAULT CURRENT_TIMESTAMP)";
    connection.query(sql, function (err, result) {
      if (err) throw err;
      console.log("Table created...");
    });
  });

  module.exports = connection;