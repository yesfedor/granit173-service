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

let connection: mysql.Connection | null = null;

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

export const getConnection = async (): Promise<mysql.Connection> => {
  if (!connection) {
    throw new Error('Database not initialized');
  }

  // Проверяем, что соединение активно
  try {
    await connection.execute('SELECT 1');
  } catch (error) {
    console.log('Connection closed, reconnecting...');
    connection = await mysql.createConnection(dbConfig);
  }

  return connection;
};

export const closeConnection = async () => {
  if (connection) {
    await connection.end();
    connection = null;
  }
};

const ensureSuperAdmin = async () => {
  if (!connection) return;

  try {
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
  } catch (error) {
    console.error('Error ensuring super admin:', error);
  }
};
