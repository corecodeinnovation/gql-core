<div align="center">

# 🌐 gql-core

**API GraphQL de referencia: subscriptions, DataLoader (N+1), paginación Relay y Prisma.**

![Tier](https://img.shields.io/badge/tier-2-0B5FFF)
![GraphQL](https://img.shields.io/badge/GraphQL-Apollo-E10098)
![Prisma](https://img.shields.io/badge/Prisma-2D3748)
![License](https://img.shields.io/badge/license-MIT-green)

Parte del portfolio técnico de Core Code Innovation.

</div>

---

## Qué es
API GraphQL schema-first sobre un dominio de proyectos/tickets. Demuestra
paginación cursor-based (Relay), mutations con errores tipados, **subscriptions**
(graphql-ws), **DataLoader** contra N+1, auth integrada con `cci-auth-service` y
límites de complejidad/profundidad.

## Quickstart
```bash
cp .env.example .env
docker compose up --build
# Landing en http://localhost:3003 · Playground en http://localhost:3003/graphql
```

## Features
- [x] Schema-first (ver src/schema.graphql)
- [x] Queries con paginación Relay + filtros
- [x] Mutations con errores tipados
- [x] Subscriptions (graphql-ws)
- [x] DataLoader contra N+1 (26 → 4 queries en listados anidados)
- [x] Auth vía JWT de cci-auth-service (directivas `@auth`/`@role`)
- [x] Query complexity + depth limiting
