import {Context, Telegraf} from 'telegraf';
import {Connection, RowDataPacket} from 'mysql2/promise';
import {saveImageFromBuffer} from '../../utils/imageUpload';
import {Category} from '../../database/models';
import * as path from 'path';
import axios from 'axios';
import {Message, Update } from 'telegraf/typings/core/types/typegram';

interface CategoryState {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
}

const categoryStates = new Map<number, CategoryState>();

export const setupCategoryHandlers = (bot: Telegraf, connection: Connection) => {
  // Показать список категорий
  bot.action('list_categories', async (ctx) => {
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM categories ORDER BY name'
      );

      const categories = rows as Category[];

      if (categories.length === 0) {
        return ctx.editMessageText('Категории не найдены');
      }

      const keyboard = categories.map(category => [
        {
          text: category.name,
          callback_data: `edit_category_${category.id}`
        }
      ]);

      await ctx.editMessageText('Список категорий:', {
        reply_markup: {
          inline_keyboard: [
            ...keyboard,
            [{text: 'Назад', callback_data: 'main_menu'}]
          ]
        }
      });
    } catch (error) {
      console.error('Error listing categories:', error);
      ctx.reply('Ошибка при получении категорий');
    }
  });

  // Начать процесс добавления категории
  bot.action('add_category', async (ctx) => {
    categoryStates.set(ctx.from.id, {});
    await ctx.editMessageText('Введите название категории:');
  });

  // Редактирование категории
  bot.action(/edit_category_(\d+)/, async (ctx) => {
    const categoryId = ctx.match[1];

    try {
      const [rows] = await connection.execute(
        'SELECT * FROM categories WHERE id = ?',
        [categoryId]
      );

      const categories = rows as Category[];

      if (categories.length === 0) {
        return ctx.editMessageText('Категория не найдена');
      }

      const category = categories[0];

      await ctx.editMessageText(
        `Категория: ${category.name}\n\n` +
        `Slug: ${category.slug}\n` +
        `Описание: ${category.description}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {text: 'Удалить', callback_data: `delete_category_${category.id}`},
                {text: 'Назад', callback_data: 'list_categories'}
              ]
            ]
          }
        }
      );
    } catch (error) {
      console.error('Error editing category:', error);
      ctx.reply('Ошибка при редактировании категории');
    }
  });

  // Удаление категории
  bot.action(/delete_category_(\d+)/, async (ctx) => {
    const categoryId = ctx.match[1];

    try {
      await connection.execute(
        'DELETE FROM categories WHERE id = ?',
        [categoryId]
      );

      await ctx.editMessageText('Категория успешно удалена');
    } catch (error) {
      console.error('Error deleting category:', error);
      ctx.reply('Ошибка при удалении категории');
    }
  });

  return {
    async onText(ctx: Context<Update.MessageUpdate<Message.TextMessage>>) {
      const state = categoryStates.get(ctx.from.id);
      if (!state) return;

      if (!state.name) {
        state.name = ctx.message.text;
        categoryStates.set(ctx.from.id, state);
        return ctx.reply('Введите slug (латиница, без пробелов):');
      }

      if (!state.slug) {
        state.slug = ctx.message.text;
        categoryStates.set(ctx.from.id, state);
        return ctx.reply('Введите описание категории:');
      }

      if (!state.description) {
        state.description = ctx.message.text;
        categoryStates.set(ctx.from.id, state);
        return ctx.reply('Пришлите изображение для категории:');
      }
    },

    async onPhoto(ctx: Context<Update.MessageUpdate<Message.PhotoMessage>>) {
      const state = categoryStates.get(ctx.from.id);
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

        // Сохраняем категорию в БД
        await connection.execute(
          'INSERT INTO categories (name, slug, description, imageUrl) VALUES (?, ?, ?, ?)',
          [state.name, state.slug, state.description, state.imageUrl]
        );

        categoryStates.delete(ctx.from.id);
        await ctx.reply('Категория успешно создана!');

      } catch (error) {
        console.error('Error creating category:', error);
        ctx.reply('Ошибка при создании категории');
      }
    }
  }
};
