import express from 'express';
import { config } from 'dotenv';
import path from 'path';

config();

export const startServer = async () => {
  const app = express();
  const PORT = process.env.SERVER_PORT || 3001;

  // Раздача статических файлов из папки public
  app.use(express.static(path.join(__dirname, '../../public')));

  app.listen(PORT, () => {
    console.log(`Image server running on port ${PORT}`);
  });
};

startServer()
