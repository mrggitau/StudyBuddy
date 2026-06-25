// Import the MySQL driver
const mysql = require('mysql2');

// Create a connection pool to manage multiple connections to database 
const pool = mysql.createPool({
    host: process.env.DB_HOST,      
    user: process.env.DB_USER,      
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,  
    waitForConnections: true,
    connectionLimit: 10,            // Max connections at once
    queueLimit: 0
});

module.exports = pool.promise(); 