import {Context, Telegraf} from 'telegraf';
import {Connection, RowDataPacket} from 'mysql2/promise';
import {saveImageFromBuffer} from '../../utils/imageUpload';
import {Product, Category} from '../../database/models';
import * as path from 'path';
import axios from 'axios';
import {Message, Update} from "telegraf/typings/core/types/typegram";

interface ProductState {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  categoryId?: number;
  price?: number;
  size?: string;
}

const productStates = new Map<number, ProductState>();

export const setupProductHandlers = (bot: Telegraf, connection: Connection) => {
  // Показать список товаров
  bot.action('list_products', async (ctx) => {
    try {
      const [rows] = await connection.execute(
        `SELECT p.*, c.name as categoryName
         FROM products p
                  LEFT JOIN categories c ON p.categoryId = c.id
         ORDER BY p.name`
      );

      const products = rows as Product[];

      if (products.length === 0) {
        return ctx.editMessageText('Товары не найдены');
      }

      const keyboard = products.map(product => [
        {
          text: `${product.name} (${(product as any).categoryName})`,
          callback_data: `edit_product_${product.id}`
        }
      ]);

      await ctx.editMessageText('Список товаров:', {
        reply_markup: {
          inline_keyboard: [
            ...keyboard,
            [{text: 'Назад', callback_data: 'main_menu'}]
          ]
        }
      });
    } catch (error) {
      console.error('Error listing products:', error);
      ctx.reply('Ошибка при получении товаров');
    }
  });

  // Начать процесс добавления товара
  bot.action('add_product', async (ctx) => {
    productStates.set(ctx.from.id, {});

    // Получаем список категорий для выбора
    const [rows] = await connection.execute(
      'SELECT * FROM categories ORDER BY name'
    );

    const categories = rows as Category[];

    const keyboard = categories.map(category => [
      {
        text: category.name,
        callback_data: `select_category_${category.id}`
      }
    ]);

    await ctx.editMessageText('Выберите категорию для товара:', {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  });

  // Выбор категории для товара
  bot.action(/select_category_(\d+)/, async (ctx) => {
    const categoryId = ctx.match[1];
    const state = productStates.get(ctx.from.id);

    if (state) {
      state.categoryId = parseInt(categoryId);
      productStates.set(ctx.from.id, state);

      await ctx.editMessageText('Введите название товара:');
    }
  });

  // Редактирование товара
  bot.action(/edit_product_(\d+)/, async (ctx) => {
    const productId = ctx.match[1];

    try {
      const [rows] = await connection.execute(
        `SELECT p.*, c.name as categoryName
         FROM products p
                  LEFT JOIN categories c ON p.categoryId = c.id
         WHERE p.id = ?`,
        [productId]
      );

      const products = rows as Product[];

      if (products.length === 0) {
        return ctx.editMessageText('Товар не найден');
      }

      const product = products[0];

      await ctx.editMessageText(
        `Товар: ${product.name}\n\n` +
        `Slug: ${product.slug}\n` +
        `Категория: ${(product as any).categoryName}\n` +
        `Цена: ${product.price ?? '-'}\n` +
        `Размер: ${product.size ?? '-'}\n` +
        `Описание: ${product.description}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {text: 'Удалить', callback_data: `delete_product_${product.id}`},
                {text: 'Назад', callback_data: 'list_products'}
              ]
            ]
          }
        }
      );
    } catch (error) {
      console.error('Error editing product:', error);
      ctx.reply('Ошибка при редактировании товара');
    }
  });

  // Удаление товара
  bot.action(/delete_product_(\d+)/, async (ctx) => {
    const productId = ctx.match[1];

    try {
      await connection.execute(
        'DELETE FROM products WHERE id = ?',
        [productId]
      );

      await ctx.editMessageText('Товар успешно удален');
    } catch (error) {
      console.error('Error deleting product:', error);
      ctx.reply('Ошибка при удалении товара');
    }
  });

  return {
    async onText(ctx: Context<Update.MessageUpdate<Message.TextMessage>>) {
      const state = productStates.get(ctx.from.id);
      if (!state || !state.categoryId) return;

      if (!state.name) {
        state.name = ctx.message.text;
        productStates.set(ctx.from.id, state);
        return ctx.reply('Введите slug товара (латиница, без пробелов):');
      }

      if (!state.slug) {
        state.slug = ctx.message.text;
        productStates.set(ctx.from.id, state);
        return ctx.reply('Введите стоимость товара:');
      }

      if (!state.price) {
        state.price = Number(ctx.message.text);
        productStates.set(ctx.from.id, state);
        return ctx.reply('Введите размер товара:');
      }

      if (!state.size) {
        state.size = ctx.message.text;
        productStates.set(ctx.from.id, state);
        return ctx.reply('Введите описание товара:');
      }

      if (!state.description) {
        state.description = ctx.message.text;
        productStates.set(ctx.from.id, state);
        return ctx.reply('Пришлите изображение для товара:');
      }
    },

    async onPhoto(ctx: Context<Update.MessageUpdate<Message.PhotoMessage>>) {
      const state = productStates.get(ctx.from.id);
      if (!state || !state.description) return;

      try {
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        const file = await ctx.telegram.getFile(photo.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

        // Скачиваем изображение
        const response = await axios.get(fileUrl, {responseType: 'arraybuffer'});
        const buffer = Buffer.from(response.data);

        // Сохраняем изображение
        const filename = path.basename(file.file_path || 'image.jpg');
        state.imageUrl = await saveImageFromBuffer(buffer, filename);

        // Сохраняем товар в БД
        await connection.execute(
          'INSERT INTO products (name, slug, description, imageUrl, categoryId, price, size) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [state.name, state.slug, state.description, state.imageUrl, state.categoryId, state.price, state.size]
        );

        productStates.delete(ctx.from.id);
        await ctx.reply('Товар успешно создан!');

      } catch (error) {
        console.error('Error creating product:', error);
        ctx.reply('Ошибка при создании товара');
      }
    }
  }
};
