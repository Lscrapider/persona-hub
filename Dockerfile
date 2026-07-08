FROM node:22.18-bookworm-slim AS builder

WORKDIR /app

ENV CI=true
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable && corepack prepare pnpm@11.10.0 --activate

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 5778

CMD ["nginx", "-g", "daemon off;"]
