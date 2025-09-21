import express from 'express';
import { initDB, getConnection } from '../../database';
import { Category, Product } from '../../database/models';

const router = express.Router();
initDB();

// Health check
router.get('/healthy', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 1. Получение списка всех категорий
router.get('/categories', async (req, res) => {
  try {
    const connection = getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM categories ORDER BY name'
    );

    res.json({
      success: true,
      data: rows as Category[]
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 2. Получение категории по slug
router.get('/categories/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const connection = getConnection();

    const [rows] = await connection.execute(
      'SELECT * FROM categories WHERE slug = ?',
      [slug]
    );

    const categories = rows as Category[];

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: categories[0]
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 3. Получение продуктов по slug категории
router.get('/categories/:slug/products', async (req, res) => {
  try {
    const { slug } = req.params;
    const connection = getConnection();

    // Сначала находим категорию по slug
    const [categoryRows] = await connection.execute(
      'SELECT id, name, imageUrl FROM categories WHERE slug = ?',
      [slug]
    );

    const categories = categoryRows as Category[];

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    const categoryId = categories[0].id;

    // Получаем продукты этой категории
    const [productRows] = await connection.execute(
      'SELECT * FROM products WHERE categoryId = ? ORDER BY name',
      [categoryId]
    );

    res.json({
      success: true,
      data: {
        category: categories[0],
        products: productRows as Product[]
      }
    });
  } catch (error) {
    console.error('Error fetching category products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 4. Получение продукта по slug
router.get('/products/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const connection = getConnection();

    const [rows] = await connection.execute(
      'SELECT * FROM products WHERE slug = ?',
      [slug]
    );

    const products = rows as Product[];

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: products[0]
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
