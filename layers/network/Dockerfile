FROM ptheblack/fgs-base as network-prune
WORKDIR app/network
RUN npm i -g pnpm
RUN pnpm --filter network --prod deploy network
RUN ls -la

FROM node:18-slim
WORKDIR /app/network

RUN ls -la
COPY --from=network-prune ./app/network .

EXPOSE 4000

CMD npm run start