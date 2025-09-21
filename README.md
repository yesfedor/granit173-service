# Granit173 Services

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

- Cписок всех категорий
```http request
GET /api/categories
```

- Категория по slug
```http request
GET /api/categories/:slug
```

- Продукты по slug категории
```http request
GET /api/categories/:slug/products
```

- Продукт по slug
```http request
GET /api/products/:slug
```


# Hosting

```shell
docker-compose up -d
```
