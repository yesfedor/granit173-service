import { Connection } from 'mysql2/promise';

export interface User {
  id: number;
  telegramId: number;
  role: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  categoryId: number;
}
