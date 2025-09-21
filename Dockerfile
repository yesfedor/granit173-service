FROM node:24-alpine

WORKDIR /app

COPY ["./package.json", "./package-lock.json*", "./"]

RUN npm install

COPY . .

RUN npm install -g ts-node

EXPOSE 3000 3001

CMD ["npm", "run", "start:all"]
