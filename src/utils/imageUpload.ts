import { nanoid } from 'nanoid';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export const saveImageFromBuffer = async (buffer: Buffer, originalname: string): Promise<string> => {
  const uploadDir = path.join(__dirname, '../../public/images');

  // Создаем директорию, если не существует
  if (!fs.existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const ext = path.extname(originalname) || '.jpg';
  const filename = `${nanoid()}${ext}`;
  const filepath = path.join(uploadDir, filename);

  await writeFile(filepath, buffer);
  return `/images/${filename}`;
};
