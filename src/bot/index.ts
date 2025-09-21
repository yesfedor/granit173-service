import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { config } from 'dotenv';
import { initDB, getConnection } from '../database';
import { setupCategoryHandlers } from './handlers/categoryHandlers';
import { setupProductHandlers } from './handlers/productHandlers';

config();

const bot = new Telegraf(process.env.BOT_TOKEN!);

export const startBot = async () => {
  await initDB();
  const connection = getConnection();

  // Проверка прав доступа
  bot.use(async (ctx, next) => {
    if (!ctx.from) return next();

    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE telegramId = ?',
      [ctx.from.id]
    );

    if ((rows as any).length === 0) {
      return ctx.reply('Доступ запрещен');
    }

    return next();
  });

  // Главное меню
  bot.action('main_menu', async (ctx) => {
    await ctx.editMessageText('Главное меню:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Управление категориями', callback_data: 'categories' }],
          [{ text: 'Управление товарами', callback_data: 'products' }]
        ]
      }
    });
  });

  // Команды
  bot.command('start', (ctx) => ctx.reply('Добро пожаловать в админ-панель!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Управление категориями', callback_data: 'categories' }],
        [{ text: 'Управление товарами', callback_data: 'products' }]
      ]
    }
  }));

  bot.action('categories', (ctx) => ctx.reply('Управление категориями', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Список категорий', callback_data: 'list_categories' }],
        [{ text: 'Добавить категорию', callback_data: 'add_category' }],
        [{ text: 'Назад', callback_data: 'main_menu' }]
      ]
    }
  }));

  bot.action('products', (ctx) => ctx.reply('Управление товарами', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Список товаров', callback_data: 'list_products' }],
        [{ text: 'Добавить товар', callback_data: 'add_product' }],
        [{ text: 'Назад', callback_data: 'main_menu' }]
      ]
    }
  }));

  // Настройка обработчиков
  setupCategoryHandlers(bot, connection);
  setupProductHandlers(bot, connection);

  bot.launch({ dropPendingUpdates: true });
  console.log('Bot started');
};

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
