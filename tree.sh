#!/bin/bash

# Создание корневой директории проекта
mkdir -p granit173-bot/{src/{bot/{commands,handlers},database/migrations,server,types,utils},public/images}

# Создание файлов в директории src/bot/commands
touch granit173-bot/src/bot/commands/categories.ts
touch granit173-bot/src/bot/commands/products.ts

# Создание файлов в директории src/bot/handlers
touch granit173-bot/src/bot/handlers/categoryHandlers.ts
touch granit173-bot/src/bot/handlers/productHandlers.ts

# Создание основных файлов в src/bot
touch granit173-bot/src/bot/index.ts

# Создание файлов базы данных
touch granit173-bot/src/database/migrations/initial.ts
touch granit173-bot/src/database/index.ts
touch granit173-bot/src/database/models.ts

# Создание файлов сервера
touch granit173-bot/src/server/index.ts

# Создание файлов типов
touch granit173-bot/src/types/index.ts

# Создание утилит
touch granit173-bot/src/utils/imageUpload.ts
touch granit173-bot/src/utils/helpers.ts

# Создание корневых файлов проекта
touch granit173-bot/src/index.ts
touch granit173-bot/.env
touch granit173-bot/package.json
touch granit173-bot/tsconfig.json
touch granit173-bot/README.md

echo "Структура проекта создана успешно!"
