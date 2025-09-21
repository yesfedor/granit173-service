import { config } from 'dotenv';
import { startBot } from './bot';

config();

// Определяем, какой модуль запускать
const moduleToRun = process.argv[2];

if (moduleToRun === 'bot') {
  startBot().catch(console.error);
} else if (moduleToRun === 'server') {
  // Импортируем и запускаем сервер только когда нужно
  import('./server').then(({ startServer }) => startServer().catch(console.error));
} else {
  console.log('Usage: npm run start:bot or npm run start:server');
  process.exit(1);
}
