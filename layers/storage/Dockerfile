FROM kade/fgs-monorepo-base as migration-prune
WORKDIR app/migrations
RUN npm i -g pnpm
RUN pnpm --filter storage --prod deploy storage

FROM node:18-alpine
WORKDIR /app/migrations

COPY --from=migration-prune ./app/storage .

CMD npm run generate
CMD npm run migrate