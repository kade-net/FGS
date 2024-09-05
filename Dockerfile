FROM node:18-slim

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml ./
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY packages ./packages
COPY layers ./layers
COPY tsconfig.base.json ./

RUN pnpm install

RUN pnpm -r build

ENV NODE_ENV=production