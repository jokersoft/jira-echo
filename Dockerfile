FROM node:16

RUN mkdir -p "/app"
WORKDIR /app

COPY . .
RUN yarn install --frozen-lockfile --production --network-timeout 300000 && rm -rf "$(yarn cache dir)"

EXPOSE 80
CMD [ "node", "server.js" ]
