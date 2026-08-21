# Protocol 01: Project Discovery & Architecture Mapping

## Phase Goal
Understand the project’s technical stack, architecture, modular boundaries, datastores, and execution runtime **before** attempting any code auditing.

---

## 1. Execution Steps

1. **Ecosystem & Monorepo Inspection**:
   - Inspect package manifests (`package.json`, `pnpm-workspace.yaml`, `cargo.toml`, `go.mod`, etc.).
   - Identify active workspaces and package dependency topology.
2. **Framework & Runtime Detection**:
   - Identify backend frameworks (NestJS, Express, FastAPI, etc.) and client frameworks (React Native, Next.js, etc.).
   - Identify database layers (Kysely, Prisma, TypeORM, raw SQL, Redis).
   - Identify authentication & authorization mechanisms (JWT, session, RLS, Guards).
3. **Entry Points & Routing Boundaries**:
   - Locate main HTTP routers/controllers, WebSocket gateways, background worker queues, and CLI commands.
4. **Database Schema & Migration Mapping**:
   - Locate database migrations and schema definitions to know the real physical schema.

---

## 2. Hard Invariants & Rules
* **DO NOT** audit individual requirements yet.
* **DO NOT** report bugs or findings yet.
* **DO NOT** suggest any code fixes yet.

---

## 3. Required Output Artifact
Produce a populated document conforming strictly to [`schemas/project-map.md`](file:///schemas/project-map.md).

Transition to: `[PROJECT_DISCOVERED]`.
