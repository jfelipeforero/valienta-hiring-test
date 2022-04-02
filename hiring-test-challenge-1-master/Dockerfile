FROM node:14.17.1-alpine as BUILD

WORKDIR /usr/src/app
COPY . .

RUN npm ci

RUN npm test

RUN npm run build

# Production image stage
FROM node:14.17.1-alpine as PROD

WORKDIR /usr/src/app

COPY --from=BUILD /usr/src/app/package.json ./package.json
COPY --from=BUILD /usr/src/app/node_modules/ ./node_modules/
COPY --from=BUILD /usr/src/app/dist/src/ ./dist/

RUN npm prune --production

ENTRYPOINT [ "node", "server.ts" ]