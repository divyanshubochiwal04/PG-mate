# Schema: Project Map (`project-map.md`)

Use this schema to produce the structured output of Phase 1 (Project Discovery).

```markdown
# Project Architecture & Discovery Map

## 1. System Metadata
- **Project Name / Scope**: <string>
- **Monorepo / Polyrepo**: <Monorepo (pnpm/turborepo/nx) | Single Package>
- **Primary Languages**: <e.g., TypeScript 5.4, Python 3.12, Rust>
- **Runtime Environment**: <e.g., Node.js 22 (Linux/Windows), JVM, Browser>

## 2. Technology & Framework Breakdown
- **Frontend / Client**: <e.g., React Native / Expo, Next.js, None>
- **Backend / API**: <e.g., NestJS, Express, FastAPI, Actix-web>
- **ORM / Query Builder**: <e.g., Kysely, Prisma, TypeORM, SQLAlchemy>
- **Databases & Datastores**: <e.g., PostgreSQL 16, Redis, SQLite>
- **Queue / Event Brokers**: <e.g., BullMQ, Kafka, RabbitMQ, None>

## 3. Entry Points & Boundaries
- **API Entry Points**: <file paths e.g., apps/api/src/main.ts, apps/api/src/app.module.ts>
- **Client Entry Points**: <file paths e.g., apps/mobile/app/_layout.tsx>
- **CLI / Worker Entry Points**: <file paths e.g., scripts/worker.ts, background cron>
- **Authentication & Authorization Gates**: <Guards, Interceptors, Middlewares paths>
- **Database Schema / Migrations Location**: <packages/database/src/schema, migrations/>

## 4. Module Map Relevant to Target Scope
| Module / Package | Path | Responsibility | Outbound Dependencies |
|---|---|---|---|
| <Name> | <Path> | <Description> | <Deps> |

## 5. Architectural Style & Constraints
- **Architectural Style**: <e.g., Clean Architecture, Layered MVC, Microservices>
- **Error Handling Pattern**: <e.g., Global Filters, Custom Domain Errors, Result Types>
- **Transaction Management**: <e.g., Unit of Work, Explicit DB Transactions, None>
```
