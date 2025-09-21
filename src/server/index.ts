import express from 'express';
import {config} from 'dotenv';
import path from 'path';
import apiRoutes from './routes/api';
import {initDB, closeConnection} from '../database';

config();

export const startServer = async () => {
  const app = express();
  const PORT = process.env.SERVER_PORT || 3001;

  try {
    await initDB();
    console.log('Database initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }

  app.use(express.json());

  app.use(express.static(path.join(__dirname, '../../public')));

  app.use('/api', apiRoutes);

  process.on('SIGINT', async () => {
    console.log('Server Shutting down...');
    await closeConnection();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Server Shutting down...');
    await closeConnection();
    process.exit(0);
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
