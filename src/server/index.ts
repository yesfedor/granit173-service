import express from 'express';
import { config } from 'dotenv';
import path from 'path';
import apiRoutes from './routes/api';

config();

export const startServer = async () => {
  const app = express();
  const PORT = process.env.SERVER_PORT || 3001;

  // Middleware
  app.use(express.json());

  // Статические файлы
  app.use('/images', express.static(path.join(__dirname, '../../public/images')));

  // API маршруты
  app.use('/api', apiRoutes);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
