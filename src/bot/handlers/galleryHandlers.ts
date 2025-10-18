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
  // Показать список изображений
  bot.action('list_gallery', async (ctx) => {
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM gallery ORDER BY name'
      );

      const galleryItems = rows as Category[];

      if (galleryItems.length === 0) {
        return ctx.editMessageText('Изображения не найдены');
      }

      const keyboard = galleryItems.map(galleryItem => [
        {
          text: galleryItem.name,
          callback_data: `delete_gallery_${galleryItem.id}`
        }
      ]);

      await ctx.editMessageText('Галерея:', {
        reply_markup: {
          inline_keyboard: [
            ...keyboard,
            [{text: 'Назад', callback_data: 'main_menu'}]
          ]
        }
      });
    } catch (error) {
      console.error('Error listing galleryItems:', error);
      ctx.reply('Ошибка при получении изображений');
    }
  });

  // Начать процесс добавления изображения галереи
  bot.action('add_gallery_item', async (ctx) => {
    categoryStates.set(ctx.from.id, {});
    await ctx.editMessageText('Введите описание изображения:');
  });

  // Удаление изображения галереи
  bot.action(/delete_gallery_(\d+)/, async (ctx) => {
    const categoryId = ctx.match[1];

    try {
      await connection.execute(
        'DELETE FROM galleryItems WHERE id = ?',
        [categoryId]
      );

      await ctx.editMessageText('Изображение успешно удалена');
    } catch (error) {
      console.error('Error deleting category:', error);
      ctx.reply('Ошибка при удалении изображения');
    }
  });

  return {
    async onText(ctx: Context<Update.MessageUpdate<Message.TextMessage>>) {
      const state = categoryStates.get(ctx.from.id);
      if (!state) return;

      if (!state.name) {
        state.name = ctx.message.text;
        categoryStates.set(ctx.from.id, state);
        return ctx.reply('Загрузите изображение:');
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

        // Сохраняем изображение в БД
        await connection.execute(
          'INSERT INTO galleryItems (name, imageUrl) VALUES (?, ?)',
          [state.name, state.imageUrl]
        );

        categoryStates.delete(ctx.from.id);
        await ctx.reply('Изображение успешно создана!');

      } catch (error) {
        console.error('Error creating category:', error);
        ctx.reply('Ошибка при создании изображения');
      }
    }
  }
};
