FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y \
    openssl \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --include=dev --ignore-scripts

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 3000

CMD ["npm", "start"]
