const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'resto-qrcode'
});

connection.connect(err => {
    if (err) {
        console.error('❌ Connection error:', err.stack);
        return;
    }
    console.log('✅ Connected to MySQL/MariaDB!');
    connection.end();
});
