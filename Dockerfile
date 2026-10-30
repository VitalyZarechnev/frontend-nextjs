FROM node:18-alpine as builder
ARG ENV=dev
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY app app
COPY src src
COPY .env *.ts *.js *.json ./
COPY .env.${ENV} .env.local
RUN npm run build

FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /src/out /usr/share/nginx/html/
