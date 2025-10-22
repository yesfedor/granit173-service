import { Telegraf } from 'telegraf';
import { config } from 'dotenv';
import {initDB, getConnection, closeConnection} from '../database';
import { setupCategoryHandlers } from './handlers/categoryHandlers';
import { setupProductHandlers } from './handlers/productHandlers';
import {setupGalleryHandlers} from "./handlers/galleryHandlers";

config();

const bot = new Telegraf(process.env.BOT_TOKEN!);

export const startBot = async () => {
  await initDB();
  const connection = await getConnection();

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
          [{ text: 'Управление товарами', callback_data: 'products' }],
          [{ text: 'Управление галереей', callback_data: 'gallery' }]
        ]
      }
    });
  });

  // Команды
  bot.command('start', (ctx) => ctx.reply('Добро пожаловать в админ-панель!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Управление категориями', callback_data: 'categories' }],
        [{ text: 'Управление товарами', callback_data: 'products' }],
        [{ text: 'Управление галереей', callback_data: 'gallery' }]
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

  bot.action('gallery', (ctx) => ctx.reply('Управление галереей', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Список изображений', callback_data: 'list_gallery' }],
        [{ text: 'Добавить изображение', callback_data: 'add_gallery_item' }],
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
  const {
    onText: categoryOnText,
    onPhoto: categoryOnPhoto,
  } = setupCategoryHandlers(bot, connection);

  const {
    onText: productOnText,
    onPhoto: productOnPhoto,
  } = setupProductHandlers(bot, connection);

  const {
    onText: galleryOnText,
    onPhoto: galleryOnPhoto,
  } = setupGalleryHandlers(bot, connection);

  bot.on('text', (ctx) => {
    categoryOnText(ctx)
    productOnText(ctx)
    galleryOnText(ctx)
  })

  bot.on('photo', (ctx) => {
    categoryOnPhoto(ctx)
    productOnPhoto(ctx)
    galleryOnPhoto(ctx)
  })

  bot.launch({ dropPendingUpdates: true });
  console.log('Bot started');
};

process.once('SIGINT', async () => {
  console.log('Bot Shutting down...');
  await closeConnection();
  bot.stop('SIGINT')
});

process.once('SIGTERM', async () => {
  console.log('Bot Shutting down...');
  await closeConnection();
  bot.stop('SIGTERM')
});
