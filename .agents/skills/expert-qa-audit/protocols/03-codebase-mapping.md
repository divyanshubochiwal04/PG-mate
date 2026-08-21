# Protocol 03: Codebase Mapping

## Phase Goal
Map every atomic requirement (`REQ-*`) identified in Phase 2 to its candidate implementation files, symbols, database tables, and routes across the codebase.

---

## 1. Execution Steps

1. **For every `REQ-ID` in `requirement-ledger.md`**:
   - Identify **Entry Point Files**: Controller route, middleware, CLI command, UI screen, or background job.
   - Identify **Service / Logic Files**: Domain services, use-cases, validators, utility helpers.
   - Identify **Persistence Files**: Repositories, ORM models, migration SQL, database schema definitions.
   - Identify **Contract / Interface Files**: DTOs, interfaces, type schemas, serialization decorators.
   - Identify **Test Files**: Existing unit, integration, or E2E specs covering this area.

2. **Search Strategy**:
   - Use ripgrep / exact pattern search on routes, table names, function names, and error codes.
   - Trace imports and dependency injection tokens to discover indirect implementations.

---

## 2. Evidence Map Matrix Example
```
REQ-01: Push token registration
  ├── Entry: apps/api/src/modules/notifications/notification.controller.ts:32
  ├── Logic: apps/api/src/modules/notifications/notification.service.ts:150
  ├── Persistence: packages/database/src/repositories/notification.repository.ts:330
  └── Schema: packages/database/src/schema/push-token.schema.ts:3
```

---

## 3. Required Output Artifact
Update `requirement-ledger.md` with candidate file paths for all requirements.

Transition to: `[CODEBASE_MAPPED]`.
