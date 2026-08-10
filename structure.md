# M SQUARE — WORKSPACE DIRECTORY STRUCTURE

This document maps out the complete, production-grade monorepo directory layout for the **M Square PG & Hostel Management System**. The structure adheres strictly to the architectural constraints (500 LOC max per file, single responsibility, feature isolation, and vendor independence) specified in the [PRD](file:///c:/Users/Acer/Desktop/M%20Square/M%20SQUARE%20—%20MASTER%20PRD.md) and [Requirements](file:///c:/Users/Acer/Desktop/M%20Square/requirement.md).

---

## 1. Monorepo Root Directory Layout

At the root level, standard configuration files govern task execution (`turbo.json`), monorepo workspaces (`pnpm-workspace.yaml`), base compiler rules (`tsconfig.base.json`), and dependency definitions.

```text
m-square/
├── apps/                               # Applications (Mobile & API)
│   ├── api/                            # Node/NestJS backend
│   └── mobile/                         # React Native / Expo client
├── packages/                           # Shared library modules
│   ├── config/                         # Environment & schema config
│   ├── contracts/                      # DTOs & API schema definitions
│   ├── database/                       # Repository patterns & abstractions
│   ├── domain/                         # Pure business logic & entities
│   ├── logger/                         # Structured logging package
│   ├── security/                       # Argon2id, JWT, & encryption
│   ├── ui/                             # Mobile design system components
│   └── validation/                     # Shared Zod validation schemas
├── infrastructure/                     # Databases, Docker, & migrations
│   ├── database/                       # SQL schema version control
│   └── docker/                         # Dev/prod containers
├── docs/                               # Project documentation
│   ├── adr/                            # Architecture Decision Records
│   ├── audits/                         # Feature audit logs
│   └── prd-compliance.md               # Quality compliance matrix
├── .env.example                        # Global environment variables template
├── .gitignore                          # Monorepo ignore rules
├── package.json                        # Global root package dependencies
├── pnpm-workspace.yaml                 # Monorepo workspace configuration
├── tsconfig.base.json                  # Base TypeScript settings
└── turbo.json                          # Turborepo caching & pipeline config
```

---

## 2. Shared Packages (`/packages`)

Shared packages are modular internal npm packages managed by `pnpm`. They decouple business logic, database technologies, and UI layers.

### 2.1 Pure Domain Layer (`/packages/domain`)
Contains the core business definitions. Crucially, this package has **zero** external library dependencies on frameworks like React, Expo, NestJS, or Supabase.

```text
packages/domain/
├── src/
│   ├── auth/                           # Domain concepts for security
│   │   ├── user.entity.ts              # User schema blueprint
│   │   ├── session.entity.ts           # Session validity rules
│   │   └── role.ts                     # RBAC Enums (OWNER, MANAGER, STAFF)
│   ├── properties/                     # Building layouts
│   │   ├── property.entity.ts          # PG/Hostel properties
│   │   ├── building.entity.ts          # Buildings within properties
│   │   ├── floor.entity.ts             # Floors within buildings
│   │   ├── room.entity.ts              # Rooms (occupancy status limits)
│   │   └── bed.entity.ts               # Bed-level allocation status
│   ├── tenants/                        # Tenant & Stay entities
│   │   ├── tenant.entity.ts            # Guest profile definitions
│   │   └── allocation.entity.ts        # Bed-to-Guest bindings
│   ├── finance/                        # Ledger accounting system
│   │   ├── ledger-entry.entity.ts      # Debits, credits, corrections
│   │   ├── payment.entity.ts           # Payment captures
│   │   └── rent-rule.entity.ts         # Rent calculation schemes
│   ├── complaints/                     # Maintenance requests
│   │   └── complaint.entity.ts         # Complaint tickets
│   ├── notifications/                  # In-app notification logs
│   │   └── notification.entity.ts      # Alert notifications
│   ├── ports/                          # Dependency inversion interfaces
│   │   ├── user.repository.ts          # User persistence contract
│   │   ├── tenant.repository.ts        # Tenant persistence contract
│   │   ├── payment.repository.ts       # Payment persistence contract
│   │   ├── property.repository.ts      # Property portfolio contract
│   │   └── storage.provider.ts         # Storage interface (S3/Supabase/Local)
│   └── index.ts                        # Module entry point
├── package.json
└── tsconfig.json
```

### 2.2 Shared Contracts (`/packages/contracts`)
Houses shared Data Transfer Objects (DTOs) and request/response envelopes to unify client-server boundaries.

```text
packages/contracts/
├── src/
│   ├── shared/                         # Core contract envelopes
│   │   ├── api-response.ts             # Standard success/error payloads
│   │   └── pagination.ts               # Pagination criteria metadata
│   ├── auth/                           # Authentication boundaries
│   │   ├── login.dto.ts                # Login request/response DTOs
│   │   └── token.dto.ts                # Refresh token payloads
│   ├── properties/                     # Property creation contracts
│   │   ├── create-property.dto.ts
│   │   └── create-room.dto.ts
│   ├── tenants/                        # Tenant DTOs
│   │   ├── create-tenant.dto.ts
│   │   └── allocation-request.dto.ts
│   ├── finance/                        # Payments and invoicing
│   │   ├── record-payment.dto.ts
│   │   └── rent-invoice.dto.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 2.3 Shared Validation (`/packages/validation`)
Houses strict Zod/Yup schema validation functions used by both API request-gateways and Mobile UI form components.

```text
packages/validation/
├── src/
│   ├── auth.schema.ts                  # Password/Email requirements
│   ├── property.schema.ts              # Building validation structures
│   ├── tenant.schema.ts                # Profile requirements
│   ├── payment.schema.ts               # Numeric validation rules
│   ├── complaint.schema.ts             # Ticket validations
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 2.4 Database Abstraction Layer (`/packages/database`)
Houses the concrete repository database adapters implementing domain ports, strictly decoupling Postgres dialects from API endpoints.

```text
packages/database/
├── src/
│   ├── postgres/                       # Postgres database adapters
│   │   ├── postgres-user.repository.ts
│   │   ├── postgres-tenant.repository.ts
│   │   ├── postgres-payment.repository.ts
│   │   └── postgres-property.repository.ts
│   ├── db-connection.ts                # Pool manager & connection config
│   ├── schema-constants.ts             # Explicit table & column maps
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 2.5 Security, Configuration, and Logs (`/packages/security`, `/packages/config`, `/packages/logger`)
Modular infrastructure utilities.

```text
packages/security/                      # Hashing and encryption utilities
├── src/
│   ├── password-hashing.ts             # Argon2id implementation
│   ├── token-generation.ts             # Cryptographic JWT & refresh tokens
│   └── constant-time-compare.ts        # Mitigation for timing attacks
├── package.json
└── tsconfig.json

packages/config/                        # Env loaders
├── src/
│   └── env-validator.ts                # Crash-on-boot configuration validator
├── package.json
└── tsconfig.json

packages/logger/                        # Custom logger wrapper
├── src/
│   └── logger.ts                       # Redacts PII/Secrets; writes JSON logs
├── package.json
└── tsconfig.json
```

---

## 3. Backend HTTP API (`/apps/api`)

Built on a modular HTTP framework (e.g., NestJS or modular Express), this application orchestrates database transactions, user permissions, and paginated routes.

```text
apps/api/
├── src/
│   ├── common/                         # Shared controller interceptors
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts# Standardized server error mapper
│   │   ├── interceptors/
│   │   │   └── envelope.interceptor.ts  # Wraps payloads in the response contract
│   │   └── middleware/
│   │       ├── correlation-id.ts       # Injects correlationId header
│   │       └── rate-limit.ts           # Injects rate-limit headers
│   ├── features/                       # Isolated business modules
│   │   ├── auth/                       # Custom Auth Services
│   │   │   ├── auth.controller.ts      # Auth route entry definitions
│   │   │   ├── login.service.ts        # Processes user login credentials
│   │   │   ├── refresh-token.service.ts# Performs token rotation
│   │   │   └── password-reset.service.ts
│   │   ├── properties/                 # Properties portfolio endpoints
│   │   │   ├── property.controller.ts
│   │   │   ├── property-create.service.ts
│   │   │   └── property-query.service.ts
│   │   ├── tenants/                    # Tenant lifecycle controllers
│   │   │   ├── tenant.controller.ts
│   │   │   ├── tenant-create.service.ts
│   │   │   ├── tenant-query.service.ts
│   │   │   ├── tenant-check-in.service.ts
│   │   │   └── tenant-check-out.service.ts
│   │   ├── payments/                   # Financial ledger routers
│   │   │   ├── payment.controller.ts
│   │   │   ├── payment-create.service.ts
│   │   │   ├── payment-query.service.ts
│   │   │   └── payment-reversal.service.ts
│   │   └── complaints/                 # Complaints modules
│   │       ├── complaint.controller.ts
│   │       ├── complaint-create.service.ts
│   │       └── complaint-query.service.ts
│   ├── app.module.ts                   # Main application wiring module
│   └── main.ts                         # Server entry point
├── package.json
└── tsconfig.json
```

---

## 4. Mobile Client (`/apps/mobile`)

React Native Expo client optimized for mobile-first user flows.

```text
apps/mobile/
├── src/
│   ├── app/                            # Expo Router screen navigation files
│   │   ├── (auth)/                     # Auth stack
│   │   │   ├── login.tsx               # Login page screen
│   │   │   └── forgot-password.tsx     # Password recovery page screen
│   │   ├── (tabs)/                     # Tab-navigated main sections
│   │   │   ├── dashboard.tsx           # Owner/Staff executive overview
│   │   │   ├── properties/             # Properties module stack
│   │   │   │   ├── index.tsx           # Property overview page
│   │   │   │   └── [id].tsx            # Building detail & room viewer
│   │   │   ├── tenants/                # Tenants module stack
│   │   │   │   ├── index.tsx           # Tenant profiles index
│   │   │   │   └── register.tsx        # Tenant check-in screen
│   │   │   ├── payments/               # Payments stack
│   │   │   │   └── index.tsx           # Ledger registry view
│   │   │   └── complaints/             # Complaints tickets view
│   │   │       └── index.tsx
│   │   ├── _layout.tsx                 # Base root router config
│   │   └── index.tsx                   # Auth guard screen gate
│   ├── components/                     # Reusable design system tokens
│   │   ├── PrimaryButton.tsx           # High contrast accessible button
│   │   ├── MoneyText.tsx               # Formatted localization of currency
│   │   ├── StatusBadge.tsx             # Context-sensitive color markers
│   │   ├── EmptyState.tsx              # Content state with CTA fallback
│   │   ├── LoadingState.tsx            # Skeletons / loader widgets
│   │   ├── ErrorState.tsx              # Error details with retry handler
│   │   ├── SearchBar.tsx               # Client-side shell for server-side search
│   │   └── PaginationFooter.tsx        # Handles next-page events
│   ├── features/                       # Local state controllers (Zustand)
│   │   ├── auth/                       # Local token store and state
│   │   │   ├── auth.store.ts
│   │   │   └── use-auth.ts
│   │   ├── properties/                 # Properties stores
│   │   │   └── use-properties.ts
│   │   └── tenants/                    # Tenants stores
│   │       └── use-tenants.ts
│   ├── services/                       # Centralized API network client
│   │   ├── api-client.ts               # Core Axios instance (injects token)
│   │   ├── auth-api.ts                 # Auth API wrapper
│   │   ├── tenant-api.ts               # Tenant network methods
│   │   ├── payment-api.ts              # Payments network methods
│   │   └── property-api.ts             # Property network methods
│   ├── theme/                          # Colors, sizes, and styling tokens
│   │   ├── colors.ts                   # Custom curated palette (No defaults)
│   │   └── typography.ts               # Custom font definitions
│   └── utils/                          # Frontend formatting functions
├── app.json                            # Expo configuration
├── package.json
└── tsconfig.json
```

---

## 5. Infrastructure Configuration (`/infrastructure`)

Handles schema migrations and docker containers.

```text
infrastructure/
├── database/
│   ├── migrations/                     # Incremental schema changes
│   │   ├── 001_initial_schema.sql      # Core tables and extensions
│   │   ├── 002_users.sql               # User accounts & roles
│   │   ├── 003_properties.sql          # Properties, buildings, floors
│   │   ├── 004_rooms.sql               # Rooms & room settings
│   │   ├── 005_beds.sql                # Bed layout specifications
│   │   ├── 006_tenants.sql             # Tenant portfolios & stay spans
│   │   ├── 007_finance.sql             # Immutable financial ledger tables
│   │   ├── 008_security.sql            # Token registries & sessions
│   │   └── 009_audit_logs.sql          # Audit logging table definitions
│   └── seed/
│       └── seed-dev.sql                # Safe mock seed data for development
└── docker/
    ├── docker-compose.yml              # Local docker stack (PostgreSQL, PGAdmin)
    └── Dockerfile.api                  # Production Docker file for Node server
```
