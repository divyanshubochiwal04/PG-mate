# M SQUARE — SYSTEM REQUIREMENTS DOCUMENT (SRD)

This document outlines the complete technical, functional, and non-functional requirements for the M Square PG & Hostel Management System, derived from the Master Product Requirement Document (PRD).

---

## 1. System Architecture & Directory Structure

### 1.1 Monorepo Architecture
The project must be structured as a monorepo containing distinct applications and shared packages.

**Required Directory Structure:**
```text
m-square/
├── apps/
│   ├── mobile/         # React Native / Expo Mobile Client
│   └── api/            # Node/Nest HTTP API
├── packages/
│   ├── domain/         # Pure Business Entities (no framework dependencies)
│   ├── contracts/      # Shared DTOs and API Response schemas
│   ├── validation/     # Shared validation schemas (e.g., Zod)
│   ├── config/         # Centralized configuration & environment loader
│   ├── logger/         # Structured logger module
│   ├── database/       # Database access interfaces and query builder setup
│   ├── security/       # Encryption, hashing, and token utilities
│   ├── ui/             # Reusable UI component library (for apps/mobile)
│   └── utils/          # General helper functions
├── infrastructure/     # Docker, database, and deployment configurations
├── docs/               # ADRs, API specs, and quality audits
└── scripts/            # Build and helper scripts
```

### 1.2 Package Responsibilities
*   **apps/mobile**: Responsible for user screens, navigation, UI states, API client usage, and secure token storage. It must NOT contain database queries, SQL, business rules, or private secrets.
*   **apps/api**: Handles HTTP routing, authentication, authorization, business workflows, request validation, pagination, and repository orchestration.
*   **packages/domain**: Contains pure business entities (`Tenant`, `Room`, `Bed`, `Allocation`, `Rent`, `Payment`, `Deposit`, `Complaint`). It must be framework-agnostic.
*   **packages/contracts**: Defines the boundary schemas between the client and server (DTOs, API responses, errors, and event definitions).
*   **packages/database**: Abstracts database access. Business layers must depend on repository interfaces (e.g., `TenantRepository`) rather than database client libraries.
*   **packages/security**: Contains secure hashing algorithms (Argon2id), random token generators, and permission checkers.

---

## 2. Infrastructure & Vendor Independence

### 2.1 Supabase Independence (Critical)
*   The system must not be tightly coupled to Supabase. Supabase may only be used as a commodity infrastructure provider.
*   Direct client SDK calls (e.g., `supabase.from(...)` or `supabase.auth`) are strictly forbidden inside business logic services.
*   The application must allow switching PostgreSQL or file storage providers (e.g., moving to Neon, AWS RDS, S3, or self-hosted servers) by modifying configuration/adapters, without rewriting business logic.

### 2.2 Storage Abstraction
All file uploads (e.g., tenant documents, receipts) must go through a `StorageProvider` interface. 
*   **Permitted Adapters**: `SupabaseStorageProvider`, `S3StorageProvider`, `LocalStorageProvider`.

---

## 3. Database & Ledger Requirements

### 3.1 Core Relational Schema Contexts
The database schema must enforce clean relationships and constraints:
1.  **Unique Constraints**: Unique room numbers within building scope; unique bed identifiers within a room.
2.  **Referential Integrity**: Strict foreign keys across the hierarchy:
    `Organization` → `Users/Properties` → `Buildings` → `Floors` → `Rooms` → `Beds` → `Tenants`.

### 3.2 Concurrency & Transactional Operations
Critical database operations must run in atomic transactions. Partial execution must be rolled back:
*   **Bed Allocation**: Create allocation record AND mark bed status as occupied. Enforce database-level locks to prevent double-booking.
*   **Checkout**: Close allocation AND release bed (set to vacant) AND update tenant status.
*   **Payment**: Create payment record AND update tenant financial balance.

### 3.3 Financial Ledger Model
*   **Ledger Principle**: Tenant financial status must be calculated dynamically from ledger entries (`charges`, `payments`, `adjustments`, `credits`, `debits`). Stored totals should only be used as performance caches, not the source of truth.
*   **Payment Immutability**: Payments, once captured, cannot be edited or deleted. Corrections must be executed via `REVERSAL` or `ADJUSTMENT` ledger transactions with audit trail references.

---

## 4. Custom Authentication & Authorization

### 4.1 Custom Auth Architecture
Supabase Auth is prohibited. Authentication is managed internally by the custom API using a secure flow:
```text
Mobile Client → API → Auth Module → User Credentials Repository → PostgreSQL
```
*   **Required tables**: `users`, `user_credentials`, `sessions`, `refresh_tokens`, `roles`, `permissions`, `role_permissions`, `user_roles`.

### 4.2 Security Primitives
*   **Password Hashing**: Passwords must be hashed using `Argon2id` with configurable, cryptographically secure parameters.
*   **Tokens**:
    *   **Access Token**: JWT format, short-lived (10–30 minutes, configurable), signed using a secure key retrieved from environment configuration.
    *   **Refresh Token**: Cryptographically random string, long-lived, rotated on use, stored as a secure hash in the database.
*   **Token Rotation & Reuse Detection**: Refreshing a token must invalidate the old refresh token and issue a new pair. If a client attempts to reuse an old refresh token, the entire session/token family must be immediately revoked to prevent theft.

### 4.3 Authorization & Ownership Isolation
*   **RBAC (Role-Based Access Control)**: Initial roles include `OWNER`, `MANAGER`, and `STAFF` with granular permissions (e.g., `property.create`, `tenant.checkout`, `payment.reverse`).
*   **Ownership Scoping**: All queries must filter resources using the authenticated user's `organization_id`. Blindly serving resources by ID without validating organization ownership (IDOR) is a release blocker.

---

## 5. API Specifications

### 5.1 Endpoint Guidelines
*   **Versioning**: All routes must be versioned (e.g., `/api/v1/auth`, `/api/v1/properties`).
*   **Response Envelope Standard**:
    *   *Success*: `{ "success": true, "data": {...}, "meta": {...} }`
    *   *Error*: `{ "success": false, "error": { "code": "...", "message": "...", "details": {...} } }`
    *   Stack traces must never leak in production error responses.

### 5.2 Pagination, Sorting, and Filtering
*   **Mandatory Pagination**: Every list endpoint (tenants, payments, complaints, etc.) must enforce page-based or cursor-based pagination.
    *   *Default size*: 20 items.
    *   *Max size*: 100 items (server-side cap enforcement).
*   **Deterministic Sorting**: Default sorting must use explicit columns (e.g., `createdAt DESC`, `id DESC`) to prevent database-dependent order fluctuations.
*   **Server-Side Search & Filter**: Search queries and status filters must be executed on the server before applying pagination.

### 5.3 Performance Constraints
*   Eager loading and query batching must be used to eliminate **N+1 query** patterns.
*   Index columns regularly used in query filters (`owner_id`, `property_id`, `status`, `due_date`, `created_at`).

---

## 6. Mobile UX/UI & Client Performance

### 6.1 UI & Mobile Usability
*   **Mobile-First UX**: Design screens for one-handed operation with large touch targets and minimal text input.
*   **Predictable Screen States**: Every screen consuming network data must handle:
    *   *LoadingState* (Skeleton loaders or spinners).
    *   *SuccessState* (Rendered data).
    *   *EmptyState* (Context-specific screen with a clear Call-To-Action, e.g. "No tenants yet [Add Tenant]").
    *   *ErrorState* (User-friendly message with a "Retry" button).
*   **Optimistic UI Restriction**: UI may NOT update optimistically for payments, checkouts, or bed allocations. The client must await explicit API confirmation before updating.

### 6.2 Data Fetching & Network Behavior
*   **Centralized Client**: All API requests must be initiated via an abstracted client (`apiClient`, `tenantApi`, etc.). Raw `fetch` or Axios calls in UI files are forbidden.
*   **Optimized Lists**: Large collections must be rendered using virtualized lists (e.g., `FlatList` or `FlashList` with infinite scroll pagination) to prevent memory leaks.
*   **Search Debouncing**: Text inputs triggering API searches must be debounced to reduce server load.
*   **Offline/Intermittent Coverage**: The client must gracefully handle session expiry and offline states, providing appropriate user alerts.

---

## 7. Security, Logging, and Secret Management

### 7.1 Input & Upload Security
*   All API request payloads (body, parameters, headers) must be strictly validated on the server using schema validators.
*   **Document Uploads**: Tenant documents must be stored in private storage buckets. Access is granted through short-lived signed URLs.
*   **File Validation**: Uploaded files must be validated for MIME type, file size, extension, and safe names (filenames must be dynamically generated, never using client input directly).

### 7.2 Rate Limiting & Brute-Force Defense
*   Rate limiting is mandatory on auth endpoints (`/login`, `/refresh`, `/password-reset`).
*   Progressive delays or temporary lockouts must be applied for repeated failed login attempts.

### 7.3 Logging & Correlation IDs
*   **Correlation ID**: Every HTTP request must be assigned a unique `correlationId` injected into response headers and audit logs.
*   **Logging Security**: Structured application logs must capture business events (`LOGIN_FAILED`, `PAYMENT_CHANGED`, etc.) but must redact credentials, tokens, PII, and raw payment methods.

### 7.4 Secret Management
*   Secrets (JWT keys, DB passwords, integration keys) must never be committed. 
*   A `.env.example` must be maintained, and the application must fail to start (crash loudly) if any required configuration variable is missing on boot.

---

## 8. Quality Assurance & Feature Sign-Off

### 8.1 File Size & Code Standard
*   **Maximum File Size**: No source code file (TS, TSX, JS, SQL, Config, Test) may exceed **500 lines** (comments and whitespace included). Target length is **100-300 lines**.
*   **Dependency flow**: Dependencies must flow inward: `UI` → `API/Application` → `Domain` → `Interfaces`. Domain packages must remain completely decoupled from database, HTTP, or mobile frameworks.

### 8.2 Testing Requirements
A feature requires four levels of test validation before sign-off:
1.  **Unit Tests**: Isolated business rules (e.g., rent calculation, token validation).
2.  **Integration Tests**: Repository-to-database connections and API response mapping.
3.  **Security Tests**: Asserting authorization boundary enforcement (e.g., confirming a user cannot access another organization's records, verifying token reuse detection).
4.  **Workflow Tests**: End-to-end user flows (e.g., Create Property → Create Bed → Allocate Bed → Generate Rent → Pay Rent → Checkout).

### 8.3 Adversarial Feature Audits
Every feature must undergo a post-implementation audit scored out of 100 points:
*   **Categories**: Functional correctness, Business logic, Security, Database integrity, API quality, UI/UX, Performance, Code quality, Testing, and PRD compliance.
*   **Score thresholds**:
    *   `>= 95`: Production quality.
    *   `>= 90`: Acceptable.
    *   `< 90`: Requires improvement.
    *   `< 80`: Blocked from sign-off.
*   **P0/P1 Blockers**: Any critical (P0) or high (P1) issue (e.g., auth bypass, data leak, financial calculation error) overrides the numerical score and blocks release.

---

## 9. Master Quality Gate Checklist

For the release of M Square V1, the following gates must be passed and verified:

- [ ] Monorepo structure implemented with clear package boundaries.
- [ ] No source file exceeding 500 lines of code.
- [ ] Complete vendor independence for database and storage adapters.
- [ ] Custom authentication (Argon2id + token rotation + session revocation) implemented.
- [ ] Granular RBAC and organization-level data isolation enforced.
- [ ] API versioning, envelope standards, and collection pagination active.
- [ ] Financial operations ledger-backed and immutable.
- [ ] Mobile-first UI with loading, empty, and error states.
- [ ] Zero secrets committed and config validation on boot active.
- [ ] Full suite of unit, integration, security, and workflow tests passing.
- [ ] Final Red Team and full system audit completed with zero P0/P1 issues.
