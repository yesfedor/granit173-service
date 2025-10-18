import { Connection } from 'mysql2/promise';

export const initialMigration = async (connection: Connection) => {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS bot_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      \`key\` VARCHAR(255) NOT NULL,
      value TEXT NOT NULL
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      telegramId BIGINT NOT NULL UNIQUE,
      role VARCHAR(20) NOT NULL DEFAULT 'admin'
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      imageUrl VARCHAR(255) NOT NULL
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      imageUrl VARCHAR(255) NOT NULL
      )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      imageUrl VARCHAR(255) NOT NULL,
      categoryId INT NOT NULL,
      size VARCHAR(255) NULL,  
      price INT NULL,  
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  // Добавляем начальные настройки
  await connection.execute(
    `INSERT IGNORE INTO bot_settings (\`key\`, value) VALUES 
    ('db_version', '1.0'),
    ('init_date', NOW())`
  );
};
