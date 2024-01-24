require('dotenv').config();

const pgp = require('pg-promise')()
const connection = {
    host: process.env.supaHost,
    port: process.env.supaPort,
    database: process.env.supaDB,
    user: process.env.supaUser,
    password: process.env.supaPass,
    ssl: { rejectUnauthorized: false },
};
const db = pgp(connection);

module.exports = db;