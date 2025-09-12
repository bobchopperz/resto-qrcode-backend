const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'yuliandra',
    database: 'restoqrcode',
    port: 5432,
});

client.connect()
    .then(() => {
        console.log('✅ Connected to PostgreSQL!');
        return client.end();
    })
    .catch(err => {
        console.error('❌ Connection error:', err.stack);
    });
