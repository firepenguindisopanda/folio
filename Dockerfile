# syntax = docker/dockerfile:1

ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app
ENV NODE_ENV="production"

FROM base AS build

COPY --link package.json package-lock.json .npmrc ./
RUN npm ci --include=dev

COPY --link . .
RUN npm run build
RUN npm prune --omit=dev

FROM base

COPY --from=build /app /app

EXPOSE 3000
CMD [ "npm", "run", "start" ]
