# DataTagger-frontend

Next.js frontend for the TUM-DataTagger research data management tool.

## Development

### Local development

```bash
pnpm install
pnpm run dev
```

### Local development with docker compose

```bash
docker compose up --build --force-recreate
```

## Production build

### Production with docker compose

```bash
docker compose -f docker-compose.production.yml up --build --force-recreate
```
