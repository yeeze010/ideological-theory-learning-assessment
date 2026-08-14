FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install --include=optional && npm install --save-dev @rollup/rollup-linux-x64-musl

FROM deps AS build
COPY . .
RUN npm run build -w packages/shared && npm run build -w apps/web

FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
