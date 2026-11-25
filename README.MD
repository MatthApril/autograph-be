

```bash
docker compose up -d --build
```

```bash
docker compose exec backend npx prisma migrate dev --name add_column
```