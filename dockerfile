# Stage 1: Build
FROM node:20 AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Stage 2: Production
FROM node:20-slim AS production

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/lib ./lib
COPY --from=build /usr/src/app/package*.json ./

COPY .env .

EXPOSE 3000

CMD ["node", "lib/app.js"]
