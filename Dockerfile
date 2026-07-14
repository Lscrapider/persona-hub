FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5778
ENV HOSTNAME=0.0.0.0

COPY package.json ./
COPY node_modules ./node_modules
COPY .next ./.next

EXPOSE 5778

CMD ["./node_modules/.bin/next", "start", "-p", "5778"]
