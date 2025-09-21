import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { initialMigration } from './migrations/initial';

config();

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

let connection: mysql.Connection;

export const initDB = async () => {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');

    await initialMigration(connection);
    await ensureSuperAdmin();

    return connection;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

const ensureSuperAdmin = async () => {
  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE telegramId = ?',
    [process.env.SUPER_ADMIN_ID]
  );

  if ((rows as any).length === 0) {
    await connection.execute(
      'INSERT INTO users (telegramId, role) VALUES (?, ?)',
      [process.env.SUPER_ADMIN_ID, 'superadmin']
    );
    console.log('Super admin created');
  }
};

export const getConnection = () => connection;
