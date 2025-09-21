# Granit173 Bot | Server

---

## Environment
node:22.6.0

## Bot

Run in production
```shell
npm run start:bot
```

---

## Server

Run in production
```shell
npm run start:server
```

### API предоставляет следующие эндпоинты:

```http request
GET /api/categories
```

```http request
GET /api/categories/:slug - категория по slug
```

```http request
GET /api/categories/:slug/products - продукты по slug категории
```

```http request
GET /api/products/:slug - продукт по slug
```
