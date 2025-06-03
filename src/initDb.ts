require("dotenv").config();

import { readFileSync } from 'fs';
import connection from './config/db';
import path from 'path';

async function runSqlScript() {
  // Read the SQL file
  const sqlFilePath = path.join(__dirname, '../rbarati.sql');
  const sql = readFileSync(sqlFilePath, 'utf-8');

  try {
    console.log('Running SQL initialization script...');
    await connection.query(sql);
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runSqlScript();
