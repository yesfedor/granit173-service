FROM node:24-alpine

WORKDIR /app

COPY ["./package.json", "./package-lock.json*", "./"]

RUN npm install

RUN npm install -g ts-node

COPY . .

EXPOSE 3000 3001

CMD ["npm", "run", "start:all"]
