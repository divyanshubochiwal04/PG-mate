# M SQUARE — MASTER PRD
## Enterprise Engineering, Architecture & Quality Addendum

**Applies to:** Entire M Square PG & Hostel Management System  
**Document Version:** 1.1  
**Status:** Mandatory Engineering Specification  
**Engineering Standard:** Enterprise / MNC-grade  
**Primary Platform:** Android Mobile  
**Architecture:** Monorepo + Modular Backend + Mobile Client  
**Deployment Goal:** Zero mandatory paid infrastructure  
**Critical Principle:** Vendor-independent architecture

---

# 1. NON-NEGOTIABLE ENGINEERING PRINCIPLES

The following rules are mandatory.

The coding agent must NOT treat them as suggestions.

## 1.1 Modular architecture

Every feature must be independently understandable, testable and maintainable.

Avoid:

- Giant files
- Giant services
- Giant controllers
- Giant components
- Giant hooks
- Giant database files
- Mixed business logic
- Mixed UI and data-access logic

---

# 2. MAXIMUM FILE SIZE

## HARD LIMIT

**No source-code file may exceed 500 lines.**

This applies to:

- TypeScript
- TSX
- JavaScript
- SQL
- configuration files containing application logic
- test files
- utility files
- service files
- controllers
- repositories

Comments and whitespace are included when determining the file size.

### Target

Although 500 lines is the absolute maximum:

> **Preferred file size: 100–300 lines.**

If a file approaches 400 lines, the agent must evaluate whether it should be split.

If a file reaches 500 lines:

> STOP → refactor → split → continue.

The agent must NEVER solve the problem by merely compressing code or removing useful whitespace/comments.

---

# 3. ONE RESPONSIBILITY PER FILE

A file should have one clear responsibility.

Bad:

```text
tenant.service.ts
→ tenant CRUD
→ payments
→ rent calculation
→ documents
→ notifications
→ complaints
```

Good:

```text
tenant-create.service.ts
tenant-update.service.ts
tenant-query.service.ts
tenant-check-in.service.ts
tenant-check-out.service.ts
tenant-validation.ts
tenant.mapper.ts
```

Small related functions may remain together if they represent one cohesive responsibility.

---

# 4. FEATURE ISOLATION

Every major feature must have its own isolated module.

Example:

```text
features/
├── auth/
├── properties/
├── buildings/
├── floors/
├── rooms/
├── beds/
├── facilities/
├── tenants/
├── allocations/
├── rent/
├── payments/
├── deposits/
├── services/
├── complaints/
├── notifications/
├── documents/
├── reports/
└── audit/
```

A feature must not directly manipulate another feature's internal implementation.

Communication must happen through:

- Public service interfaces
- Domain contracts
- Application commands/queries
- Events where appropriate

---

# 5. MONOREPO REQUIREMENT

The project MUST be a monorepo.

Recommended structure:

```text
m-square/
│
├── apps/
│   ├── mobile/
│   └── api/
│
├── packages/
│   ├── domain/
│   ├── contracts/
│   ├── validation/
│   ├── config/
│   ├── logger/
│   ├── database/
│   ├── security/
│   ├── ui/
│   └── utils/
│
├── infrastructure/
│   ├── docker/
│   ├── database/
│   └── deployment/
│
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── api/
│   ├── security/
│   └── audits/
│
├── scripts/
│
├── .github/
│   └── workflows/
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .gitignore
├── .env.example
└── README.md
```

The exact tooling can change if technically justified, but the monorepo principle must remain.

---

# 6. MONOREPO PACKAGE RESPONSIBILITIES

## apps/mobile

Contains:

- Expo application
- Screens
- Navigation
- Mobile-specific UI
- Mobile state
- API client usage
- Secure token storage

Must NOT contain:

- Database queries
- SQL
- Business rules
- Password hashing
- Secret keys
- Service-role credentials

---

## apps/api

Contains:

- HTTP API
- Authentication
- Authorization
- Application services
- Business workflows
- Request validation
- API error handling
- Pagination
- Repository orchestration

The API must be independent of Supabase.

---

## packages/domain

Contains pure business concepts.

Examples:

```text
Tenant
Room
Bed
Allocation
Rent
Payment
Deposit
Complaint
```

Domain code should have no dependency on:

- React Native
- Expo
- Supabase
- HTTP
- PostgreSQL-specific APIs

---

## packages/contracts

Contains shared contracts:

- DTO types
- API response contracts
- Pagination contracts
- Error contracts
- Event contracts

Avoid sharing internal backend entities directly with frontend.

---

## packages/validation

Contains reusable validation schemas.

Example:

```text
createTenantSchema
createRoomSchema
createPaymentSchema
createPropertySchema
```

---

## packages/database

Contains database abstraction and implementations.

The application must interact through defined interfaces.

---

## packages/security

Contains reusable security primitives:

- Password hashing
- Token hashing
- Random token generation
- Security utilities
- Permission helpers
- Constant-time comparison
- Security-related validators

---

## packages/config

Centralized configuration loading and validation.

No random:

```text
process.env.X
```

throughout the application.

---

# 7. SUPABASE INDEPENDENCE

## ABSOLUTE REQUIREMENT

The application must NOT be architecturally dependent on Supabase.

Supabase may be used as an infrastructure provider, but it must remain replaceable.

The following must NOT spread throughout the application:

```text
supabase.from(...)
supabase.auth...
supabase.storage...
```

Business services must never directly call Supabase.

---

# 8. DATABASE ABSTRACTION

The application should communicate through repository/data-access interfaces.

Example:

```text
TenantRepository
PaymentRepository
RoomRepository
BedRepository
PropertyRepository
```

Implementation:

```text
PostgresTenantRepository
PostgresPaymentRepository
```

The service should depend on:

```text
TenantRepository
```

not:

```text
SupabaseClient
```

---

# 9. DATABASE VENDOR INDEPENDENCE

The core business logic must remain portable.

Primary database:

```text
PostgreSQL
```

Supabase PostgreSQL is acceptable.

However:

> The application must be capable of moving from Supabase PostgreSQL to another PostgreSQL provider without rewriting the business layer.

Future migration target examples:

```text
Supabase
→ Neon
→ Railway
→ Render
→ AWS RDS
→ Self-hosted PostgreSQL
```

Business logic should remain unchanged.

---

# 10. STORAGE ABSTRACTION

Documents and images must use a storage interface.

Example:

```text
StorageProvider
```

Possible implementations:

```text
SupabaseStorageProvider
S3StorageProvider
LocalStorageProvider
```

Application code must depend on:

```text
StorageProvider
```

not Supabase Storage.

---

# 11. AUTHENTICATION — CUSTOM AUTH

The application will NOT use Supabase Auth.

Authentication will be implemented by M Square itself.

Supabase may still provide PostgreSQL infrastructure, but authentication belongs to the application.

---

# 12. CUSTOM AUTH ARCHITECTURE

Authentication flow:

```text
Mobile
 ↓
API
 ↓
Auth Module
 ↓
User Repository
 ↓
PostgreSQL
```

The mobile application must never directly authenticate against Supabase Auth.

---

# 13. AUTH USER MODEL

Core entities:

```text
users
user_credentials
sessions
refresh_tokens
roles
permissions
role_permissions
user_roles
```

The exact schema may be normalized further.

---

# 14. PASSWORD SECURITY

Passwords must NEVER be stored in plaintext.

Use a modern password hashing algorithm such as:

```text
Argon2id
```

Recommended parameters must be documented and configurable.

Never use:

```text
MD5
SHA1
plain SHA256
plaintext
reversible encryption
```

for password storage.

---

# 15. LOGIN FLOW

```text
User
 ↓
Email/username + password
 ↓
API
 ↓
Validate credentials
 ↓
Verify Argon2id hash
 ↓
Create session
 ↓
Issue access token
 ↓
Issue refresh token
 ↓
Mobile stores credentials securely
```

---

# 16. ACCESS TOKEN

Access tokens must be short-lived.

Recommended initial target:

```text
10–30 minutes
```

Exact duration should be configurable.

Do not create extremely long-lived access tokens.

---

# 17. REFRESH TOKEN

Refresh tokens must:

- Be cryptographically random
- Be long-lived compared to access tokens
- Be stored securely
- Be rotated
- Support revocation
- Be associated with a session/device
- Not be stored in plaintext in the database if avoidable

Store a secure hash/fingerprint rather than the raw refresh token where practical.

---

# 18. TOKEN ROTATION

On refresh:

```text
Old Refresh Token
       ↓
Validate
       ↓
Revoke / Rotate
       ↓
New Refresh Token
       ↓
New Access Token
```

Reuse detection should invalidate the affected session/token family.

---

# 19. MOBILE TOKEN STORAGE

Sensitive authentication material must NOT be stored in:

```text
AsyncStorage
plain local files
Redux persistence
unprotected JSON
```

Use platform-secure storage through Expo-compatible secure storage.

---

# 20. SESSION MANAGEMENT

Each login creates a session.

Session information should include:

- User
- Session ID
- Device information where appropriate
- Created at
- Last activity
- Expiry
- Revoked status

User should eventually be able to see/revoke active sessions.

---

# 21. AUTHORIZATION

Authentication answers:

> Who are you?

Authorization answers:

> What are you allowed to do?

These must remain separate.

---

# 22. RBAC

Initial roles:

```text
OWNER
MANAGER
STAFF
```

Permissions should be granular.

Examples:

```text
property.read
property.create
property.update
property.delete

tenant.read
tenant.create
tenant.update
tenant.checkout

payment.read
payment.create
payment.reverse

report.read
user.manage
```

---

# 23. PERMISSION CHECKING

Permission checks must happen in the API.

Frontend checks are for UX only.

The API must reject unauthorized operations even if a malicious client manually calls the endpoint.

---

# 24. OWNERSHIP ISOLATION

Every business entity must belong to an owner/organization context.

Recommended hierarchy:

```text
Organization
 ↓
Users
 ↓
Properties
 ↓
Buildings
 ↓
Floors
 ↓
Rooms
 ↓
Beds
 ↓
Tenants
```

All queries must be scoped to the authenticated user's authorized organization.

---

# 25. IDOR PREVENTION

Never trust IDs received from the client.

Bad:

```text
GET /tenants/123
```

and blindly returning tenant 123.

Correct:

```text
Find tenant 123
AND verify tenant belongs to user's authorized organization
```

Every resource access must perform authorization at the resource boundary.

---

# 26. OBJECT-LEVEL AUTHORIZATION

Authorization must exist for:

- Property
- Building
- Floor
- Room
- Bed
- Tenant
- Allocation
- Payment
- Deposit
- Document
- Complaint
- Report

---

# 27. SECURITY LAYERS

Security must exist at multiple levels:

```text
Mobile
 ↓
API Gateway / HTTP Layer
 ↓
Authentication
 ↓
Authorization
 ↓
Validation
 ↓
Application Service
 ↓
Repository
 ↓
Database
```

No single security layer should be considered sufficient.

---

# 28. INPUT VALIDATION

All external input must be validated.

Validate:

- Body
- Query parameters
- Path parameters
- Headers where relevant
- File metadata

Never trust mobile input.

---

# 29. SQL INJECTION

The application must use parameterized database access.

Never construct SQL using unsafe string concatenation.

---

# 30. MASS ASSIGNMENT PROTECTION

Do not blindly map request bodies to database entities.

Bad:

```text
Object.assign(entity, req.body)
```

Use explicit DTO → domain mapping.

---

# 31. SECURITY HEADERS

API should implement appropriate security headers where applicable.

Examples:

- Content-Type protection
- Frame protection
- Referrer policy
- Strict transport security in production
- Appropriate cache controls

---

# 32. RATE LIMITING

Rate limiting is mandatory for sensitive endpoints.

Especially:

```text
/login
/refresh
/password-reset
/forgot-password
```

Rate limits should be configurable.

---

# 33. LOGIN BRUTE-FORCE PROTECTION

Repeated failed login attempts should trigger progressively stronger protection.

Possible mechanisms:

- Rate limiting
- Temporary lockout
- Increasing delay
- Security event logging

Do not permanently lock users based solely on a tiny number of failed attempts.

---

# 34. PASSWORD RESET

Password reset must use:

- Cryptographically random token
- Short expiry
- Single-use token
- Secure storage
- Session invalidation after password change where appropriate

Never expose whether a particular email exists through overly specific responses.

---

# 35. SECURITY LOGGING

Security events must be logged.

Examples:

```text
LOGIN_SUCCESS
LOGIN_FAILED
LOGOUT
TOKEN_REFRESH
TOKEN_REUSE_DETECTED
PASSWORD_CHANGED
PASSWORD_RESET_REQUESTED
PASSWORD_RESET_COMPLETED
PERMISSION_DENIED
SUSPICIOUS_ACCESS
```

Logs must not contain:

- Passwords
- Raw access tokens
- Raw refresh tokens
- Sensitive documents
- Full payment credentials

---

# 36. SECRET MANAGEMENT

Secrets must never be committed.

Required:

```text
.env.example
```

Actual environment files must be ignored.

Never put:

```text
service role key
database password
JWT secret
private signing key
```

inside source code.

---

# 37. JWT / TOKEN SIGNING

If JWT is used:

- Secret/private key must come from environment configuration.
- No fallback production secret.
- Algorithm must be explicitly configured.
- Token claims must be minimal.
- Token expiry must be enforced.

---

# 38. API VERSIONING

API should be versioned.

Example:

```text
/api/v1/auth
/api/v1/properties
/api/v1/tenants
/api/v1/payments
```

Future versions:

```text
/api/v2/...
```

must be possible without breaking V1.

---

# 39. API RESPONSE STANDARD

Responses must follow a consistent contract.

Success:

```text
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error:

```text
{
  "success": false,
  "error": {
    "code": "...",
    "message": "...",
    "details": {}
  }
}
```

Internal stack traces must never be exposed in production.

---

# 40. PAGINATION — MANDATORY

Every potentially large collection endpoint must be paginated.

Examples:

```text
GET /tenants
GET /payments
GET /rooms
GET /beds
GET /complaints
GET /audit-logs
GET /notifications
```

No endpoint should return unlimited records.

---

# 41. PAGINATION CONTRACT

Initial API standard:

```text
?page=1
&pageSize=20
```

with server-side maximum:

```text
MAX_PAGE_SIZE = 100
```

If a client requests:

```text
?pageSize=10000
```

the server must reject or cap it.

---

# 42. PAGINATION RESPONSE

Example:

```text
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 250,
    "totalPages": 13,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

# 43. PAGINATION STRATEGY

Offset pagination may be used initially.

For very large/high-frequency datasets, architecture should support cursor pagination later.

The pagination mechanism must remain abstract enough to change without rewriting UI/business logic.

---

# 44. PAGINATION + FILTERING

Pagination must work together with:

- Search
- Sort
- Filters
- Property selection
- Status
- Date ranges

The API must apply filtering before pagination.

---

# 45. SORTING

List APIs must use deterministic ordering.

Example:

```text
createdAt DESC
id DESC
```

Do not depend on unspecified database order.

---

# 46. SEARCH

Search must be server-side for large collections.

Do not download 10,000 tenants to the mobile app and filter locally.

---

# 47. API PERFORMANCE

Endpoints must:

- Select only required fields where practical.
- Avoid N+1 queries.
- Use proper indexes.
- Paginate.
- Avoid unnecessary joins.
- Avoid returning giant nested objects.

---

# 48. DATABASE INDEXING

Indexes must be designed around real query patterns.

Important candidates:

```text
owner_id
property_id
building_id
floor_id
room_id
bed_id
tenant_id
status
created_at
due_date
payment_date
```

Exact indexes must be decided after schema/query analysis.

---

# 49. N+1 QUERY PREVENTION

The agent must inspect list/detail endpoints for N+1 patterns.

Bad:

```text
Get 100 tenants
→ query room for each tenant
→ query bed for each tenant
→ query payment for each tenant
```

Use optimized queries/batching.

---

# 50. TRANSACTIONAL BUSINESS OPERATIONS

The following must be atomic where required:

### Bed allocation

```text
Create allocation
+
Mark bed occupied
```

### Checkout

```text
Close allocation
+
Release bed
+
Update tenant status
```

### Payment

```text
Create payment
+
Allocate payment
+
Update financial state
```

A partial operation must not leave inconsistent data.

---

# 51. CONCURRENCY CONTROL

Critical resources must protect against race conditions.

Example:

Two managers simultaneously attempt:

```text
Bed A → Tenant X
Bed A → Tenant Y
```

Only one allocation may succeed.

The database must enforce this, not merely the UI.

---

# 52. DATABASE CONSTRAINTS

Business rules that can safely be enforced at database level should be enforced there.

Examples:

- Unique room number within appropriate scope.
- Unique bed identifier within room.
- One active allocation per bed.
- Valid foreign keys.
- Valid enum/status values where appropriate.

---

# 53. FINANCIAL LEDGER PRINCIPLE

Financial data must be treated as records, not just mutable totals.

Avoid making this the sole source of truth:

```text
tenant.due_amount
```

Instead:

```text
charges
payments
adjustments
credits
debits
```

derive financial state from ledger data.

Cached totals may exist for performance but must not become the only truth.

---

# 54. PAYMENT IMMUTABILITY

Payments must not be casually edited or deleted.

Corrections should use:

```text
REVERSAL
ADJUSTMENT
CORRECTION
```

with audit history.

---

# 55. AUDIT TRAIL

Important business actions require audit logging.

Every audit record should identify:

```text
actor
action
entityType
entityId
timestamp
metadata
```

Sensitive old/new values should be captured carefully without storing unnecessary personal information.

---

# 56. UI ARCHITECTURE

Mobile application must follow a modular structure.

Example:

```text
src/
├── app/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── properties/
│   ├── tenants/
│   ├── rooms/
│   ├── beds/
│   ├── payments/
│   └── complaints/
├── components/
├── hooks/
├── services/
├── state/
├── theme/
└── utils/
```

---

# 57. UI COMPONENT ISOLATION

Reusable components should be extracted.

Examples:

```text
PrimaryButton
MoneyText
StatusBadge
EmptyState
LoadingState
ErrorState
SearchBar
PaginationFooter
ConfirmDialog
```

Feature-specific components remain inside the feature.

---

# 58. MOBILE-FIRST UX

Every screen must be designed for mobile first.

Priorities:

1. One-handed usability.
2. Large touch targets.
3. Minimal typing.
4. Clear hierarchy.
5. Fast navigation.
6. Low cognitive load.
7. Clear feedback.

---

# 59. UX FLOW PRINCIPLE

Common operations should require minimum practical steps.

Example:

```text
Add Tenant
→ Select bed
→ Enter tenant details
→ Set rent
→ Confirm
```

Avoid unnecessary wizard screens.

---

# 60. EMPTY STATES

Every list must define a useful empty state.

Example:

```text
No tenants yet.

[Add Tenant]
```

Not:

```text
No Data
```

---

# 61. ERROR STATES

Every network-dependent screen must define:

- Loading
- Success
- Empty
- Error
- Retry

---

# 62. OPTIMISTIC UI

Optimistic updates may be used only where rollback is safe.

Do NOT optimistically confirm:

- Payments
- Checkout
- Bed allocation
- Financial transactions

until server confirmation.

---

# 63. MOBILE PERFORMANCE

Avoid:

- Unnecessary re-renders
- Huge lists without virtualization
- Large image loading
- Repeated API requests
- Unbounded state
- Heavy computations on UI thread

Use virtualized lists for large datasets.

---

# 64. DATA FETCHING

Server data should have a predictable data-fetching strategy.

Use:

- Query caching
- Request deduplication
- Pagination
- Cache invalidation
- Pull-to-refresh where useful

Avoid scattering raw fetch calls throughout screens.

---

# 65. API CLIENT

Mobile must communicate with the backend through a centralized API client.

Do not write:

```text
fetch(...)
```

randomly inside every screen.

Instead:

```text
apiClient
tenantApi
paymentApi
propertyApi
```

---

# 66. ERROR NORMALIZATION

API errors must be converted into user-friendly UI errors.

Example:

Backend:

```text
BED_ALREADY_OCCUPIED
```

UI:

```text
This bed has just been allocated to another tenant.
Please choose another bed.
```

---

# 67. BUSINESS LOGIC LOCATION

Business logic belongs in the backend/domain layer.

Examples:

- Rent calculation
- Checkout calculation
- Deposit refund
- Bed allocation rules
- Payment allocation
- Permission decisions

The mobile app should not be the source of truth.

---

# 68. FRONTEND VALIDATION VS BACKEND VALIDATION

Both are required.

Frontend:

```text
Fast UX
```

Backend:

```text
Actual enforcement
```

Never trust frontend validation.

---

# 69. DOCUMENTATION REQUIREMENT

Every major architecture decision must be documented.

Use ADRs:

```text
docs/adr/
```

Examples:

```text
ADR-001-monorepo.md
ADR-002-custom-auth.md
ADR-003-database-abstraction.md
ADR-004-pagination.md
ADR-005-storage-abstraction.md
```

---

# 70. DEVELOPMENT WORKFLOW — MNC STYLE

Development must follow:

```text
Requirement
↓
Technical Design
↓
Implementation
↓
Tests
↓
Self Review
↓
Brutal Audit
↓
Fix
↓
Re-test
↓
Documentation
↓
Feature Sign-off
```

A feature is NOT complete immediately after coding.

---

# 71. FEATURE IMPLEMENTATION PROTOCOL

For every feature, the agent must create a feature task document containing:

```text
Feature
Business objective
Scope
Out of scope
Dependencies
Database changes
API changes
UI changes
Security considerations
Business rules
Acceptance criteria
Test cases
```

---

# 72. BEFORE CODING — IMPACT ANALYSIS

Before implementation, agent must inspect:

- Existing architecture
- Existing modules
- Existing database
- Existing API contracts
- Existing security
- Existing tests
- Existing dependencies

The agent must avoid breaking previously completed functionality.

---

# 73. IMPLEMENTATION

Implementation should happen in small commits/steps.

Prefer:

```text
DB
→ repository
→ domain/application
→ API
→ tests
→ mobile data layer
→ UI
→ integration
```

rather than writing the entire feature in one giant operation.

---

# 74. MANDATORY POST-FEATURE BRUTAL AUDIT

**Every feature implementation must be audited immediately after implementation.**

No exceptions.

The audit must be adversarial.

The agent must assume:

> “The implementation may be wrong until proven correct.”

---

# 75. BRUTAL AUDIT CATEGORIES

Every audit must evaluate:

### A. Functional correctness

- Does it actually work?
- Are all acceptance criteria satisfied?
- Are edge cases handled?
- Are error states handled?

### B. Business logic

- Does implementation match PRD?
- Are calculations correct?
- Are state transitions correct?
- Are historical records preserved?

### C. Security

- Authentication
- Authorization
- IDOR
- Input validation
- Secrets
- Token handling
- Data leakage
- File access
- Rate limiting

### D. Database

- Relationships
- Constraints
- Indexes
- Transactions
- Race conditions
- N+1
- Data integrity

### E. API

- Contracts
- Validation
- Pagination
- Filtering
- Sorting
- Error handling
- Authorization

### F. UI/UX

- Mobile usability
- Loading state
- Empty state
- Error state
- Navigation
- Accessibility
- Touch targets
- Form usability

### G. Code quality

- File size
- Separation of concerns
- Duplication
- Naming
- Coupling
- Complexity
- Dead code

### H. Architecture

- Correct module boundary
- Dependency direction
- Supabase isolation
- Domain independence
- Reusability

### I. Performance

- API calls
- Database queries
- Rendering
- Memory
- Large lists
- Image loading

### J. Testing

- Unit tests
- Integration tests
- Security tests
- Edge cases
- Regression

### K. PRD compliance

- Requirement implemented?
- Requirement partially implemented?
- Requirement missing?
- Requirement implemented incorrectly?

---

# 76. AUDIT RESULT FORMAT

Every feature audit must produce:

```text
FEATURE:
STATUS:

FUNCTIONALITY: PASS / PARTIAL / FAIL
BUSINESS LOGIC: PASS / PARTIAL / FAIL
SECURITY: PASS / PARTIAL / FAIL
DATABASE: PASS / PARTIAL / FAIL
API: PASS / PARTIAL / FAIL
UI/UX: PASS / PARTIAL / FAIL
PERFORMANCE: PASS / PARTIAL / FAIL
CODE QUALITY: PASS / PARTIAL / FAIL
TESTING: PASS / PARTIAL / FAIL
PRD COMPLIANCE: PASS / PARTIAL / FAIL
```

Then:

```text
Critical Issues
High Issues
Medium Issues
Low Issues
Technical Debt
Recommended Improvements
```

---

# 77. AUDIT SEVERITY

## P0 — Critical

Examples:

- Data leak
- Authentication bypass
- Cross-owner access
- Payment corruption
- Duplicate financial transaction
- Secret exposure

Must be fixed immediately.

---

## P1 — High

Examples:

- Broken business flow
- Major incorrect calculation
- Authorization gap
- Serious race condition
- Data inconsistency

Must be fixed before feature sign-off.

---

## P2 — Medium

Examples:

- Significant UX issue
- Performance issue
- Missing edge case
- Maintainability issue

Must be fixed before production unless explicitly accepted.

---

## P3 — Low

Examples:

- Minor UI improvement
- Naming improvement
- Non-critical refactor

Can become tracked technical debt.

---

# 78. FEATURE SIGN-OFF

Feature status may only become:

```text
DONE
```

when:

- Implementation complete
- Tests pass
- Brutal audit complete
- P0 issues = 0
- P1 issues = 0
- No known security blocker
- PRD acceptance criteria satisfied
- Documentation updated

---

# 79. REGRESSION REQUIREMENT

After every feature:

```text
Feature tests
+
Existing test suite
```

must run.

A new feature must not be considered successful if it breaks an old feature.

---

# 80. DEFINITION OF READY

A feature is ready for implementation only when:

- Requirement is clear.
- Business rules are defined.
- Acceptance criteria exist.
- Dependencies are known.
- Security impact is understood.
- Database impact is understood.
- UI flow is understood.

If something critical is ambiguous:

> Agent must STOP and request clarification instead of inventing business logic.

---

# 81. DEFINITION OF DONE

A feature is done only when:

```text
Code
+
Tests
+
Security
+
Audit
+
Documentation
+
Regression
```

are complete.

---

# 82. CODE REVIEW STANDARD

Every feature should be reviewable as if another MNC engineer will inspect it.

Review questions:

- Why is this code here?
- Why does this module own this responsibility?
- Can this be tested independently?
- Can this be replaced?
- Is this secure?
- Is this performant?
- Is this business rule correct?
- Is this future migration safe?
- Is this code unnecessarily complex?

---

# 83. DEPENDENCY RULES

Dependencies must flow inward toward stable abstractions.

Example:

```text
UI
 ↓
Application/API
 ↓
Domain
 ↓
Interfaces
 ↓
Infrastructure implementations
```

Domain must NOT depend on:

```text
Supabase
Expo
React Native
HTTP
PostgreSQL client
```

---

# 84. CIRCULAR DEPENDENCY PROHIBITION

No circular module dependencies.

Examples prohibited:

```text
tenant → payment → tenant
```

or:

```text
feature A → feature B → feature A
```

Shared contracts should be extracted where required.

---

# 85. DUPLICATION POLICY

Avoid duplicated:

- Validation
- API request logic
- Permission checks
- Formatting
- Business calculations

But do not create absurdly generic abstractions merely to eliminate tiny duplication.

Prefer clear code over premature abstraction.

---

# 86. FILE NAMING

Use predictable naming.

Examples:

```text
create-tenant.dto.ts
create-tenant.service.ts
tenant.repository.ts
tenant.mapper.ts
tenant-policy.ts
tenant.routes.ts
tenant.schema.ts
```

Avoid vague names:

```text
helper.ts
misc.ts
common2.ts
finalService.ts
utilsNew.ts
```

---

# 87. TEST FILE ISOLATION

Tests should also remain modular.

Avoid one giant:

```text
everything.spec.ts
```

Prefer:

```text
tenant-create.spec.ts
tenant-checkout.spec.ts
tenant-permission.spec.ts
payment-create.spec.ts
payment-reversal.spec.ts
bed-allocation.spec.ts
```

---

# 88. SQL FILE ISOLATION

Do not maintain one giant SQL file.

Use migration files:

```text
001_initial_schema.sql
002_users.sql
003_properties.sql
004_rooms.sql
005_beds.sql
006_tenants.sql
007_finance.sql
008_security.sql
```

or equivalent migration tooling.

---

# 89. DATABASE MIGRATION RULE

Never manually change production schema without a migration.

Every schema change must be reproducible.

Migration:

```text
Development
→ Test
→ Production
```

must produce the same resulting schema.

---

# 90. SEED DATA

Development seed data may include:

- Demo owner
- Demo property
- Demo building
- Demo rooms
- Demo beds
- Demo tenants

But:

> Seed/demo credentials must never become production credentials.

---

# 91. LOGGING

Application logging must be structured.

Useful fields:

```text
timestamp
level
service
requestId
userId
organizationId
action
duration
```

Sensitive values must be redacted.

---

# 92. REQUEST CORRELATION

API requests should have a request/correlation ID.

This allows debugging:

```text
Mobile error
→ Request ID
→ API logs
→ Database operation
```

---

# 93. OBSERVABILITY

Initial zero-cost implementation should support:

- Structured logs
- Error logging
- Request IDs
- Basic performance timing
- Audit logs

Paid observability tools can be introduced later.

---

# 94. HEALTH CHECK

API should expose a lightweight health endpoint.

Example:

```text
GET /health
```

It should verify basic application availability.

A deeper readiness check may verify database connectivity.

---

# 95. CONFIGURATION VALIDATION

Application startup must fail clearly if required environment variables are missing.

Never silently fall back to insecure defaults.

Bad:

```text
JWT_SECRET || "secret123"
```

Correct:

```text
Missing required configuration
→ application startup fails
```

---

# 96. ERROR HANDLING STANDARD

Errors must be classified.

Examples:

```text
AUTH_INVALID_CREDENTIALS
AUTH_SESSION_EXPIRED
FORBIDDEN
RESOURCE_NOT_FOUND
VALIDATION_FAILED
BED_ALREADY_OCCUPIED
PAYMENT_INVALID
PAYMENT_ALREADY_REVERSED
CONFLICT
INTERNAL_ERROR
```

---

# 97. HTTP STATUS STANDARD

Use appropriate HTTP status codes.

Examples:

```text
200 OK
201 CREATED
204 NO CONTENT
400 BAD REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT FOUND
409 CONFLICT
422 UNPROCESSABLE ENTITY
429 TOO MANY REQUESTS
500 INTERNAL SERVER ERROR
```

---

# 98. MOBILE SECURITY

The mobile application must:

- Use HTTPS in production.
- Securely store tokens.
- Avoid logging secrets.
- Avoid logging personal data unnecessarily.
- Avoid shipping backend secrets.
- Validate server responses.
- Handle session expiry gracefully.

---

# 99. SENSITIVE DATA MINIMIZATION

Only collect data actually required.

Do not collect unnecessary:

- Personal information
- Identity documents
- Location data
- Device information

Every sensitive field must have a business reason.

---

# 100. DOCUMENT SECURITY

Tenant documents are sensitive.

Requirements:

- Private storage
- Authorized access
- Short-lived signed URLs where applicable
- No public bucket
- No direct predictable URLs
- Access verification
- Upload type validation
- File size limit
- Safe file naming

---

# 101. FILE UPLOAD SECURITY

Validate:

- MIME type
- Extension
- File size
- File name
- Storage path

Never trust the original filename.

Use generated safe object keys.

---

# 102. PAGINATION UI

Mobile list screens must not render thousands of records at once.

Implement:

- Initial page
- Pull to refresh
- Load more / infinite scroll
- Loading footer
- End-of-list state
- Retry state

---

# 103. DEBOUNCED SEARCH

Search input should be debounced.

Do not send an API request on every keystroke.

---

# 104. MOBILE NETWORK BEHAVIOR

The app must gracefully handle:

```text
Fast network
Slow network
No network
Intermittent network
Expired session
Server unavailable
```

Users should receive actionable feedback.

---

# 105. ACCESSIBILITY

At minimum:

- Sufficient contrast
- Readable text
- Proper labels
- Accessible touch targets
- Meaningful error messages
- Avoid color-only status indicators

---

# 106. DESIGN CONSISTENCY

All features must use the same:

- Typography
- Buttons
- Forms
- Cards
- Status indicators
- Spacing
- Navigation
- Loading patterns

A new feature must not introduce a completely different visual language.

---

# 107. BUSINESS WORKFLOW TESTING

Tests must simulate real owner workflows, not just isolated functions.

Example:

```text
Create property
→ Create building
→ Create room
→ Create beds
→ Add tenant
→ Allocate bed
→ Generate rent
→ Record payment
→ View dashboard
→ Checkout
→ Verify vacancy
→ Verify history
```

---

# 108. SECURITY TESTING

Mandatory security scenarios:

### Test 1

User A attempts to access User B's tenant.

Expected:

```text
403 / 404
```

depending on security design.

### Test 2

User changes tenant ID manually.

Expected:

```text
Access denied.
```

### Test 3

Expired access token.

Expected:

```text
401
```

### Test 4

Refresh token reuse.

Expected:

```text
Session/token family revoked.
```

### Test 5

Unauthorized payment creation.

Expected:

```text
403
```

---

# 109. BUSINESS LOGIC TESTING

Test:

- Different rents in same room
- Multiple tenants in same room
- Partial payment
- Full payment
- Overpayment
- Advance
- Deposit
- Checkout with outstanding
- Checkout with refund
- Bed transfer
- Bed already occupied
- Tenant history

---

# 110. PERFORMANCE AUDIT

After each major feature the agent must ask:

```text
How many API calls?
How many DB queries?
Can this produce N+1?
What happens with 100 records?
What happens with 10,000 records?
Does the UI remain smooth?
```

---

# 111. SECURITY AUDIT

After each feature:

```text
Can another user access this?
Can the client manipulate IDs?
Can the client bypass UI permissions?
Can sensitive data leak?
Are secrets exposed?
Can requests be replayed?
Can the operation be duplicated?
Can race conditions corrupt data?
```

---

# 112. PRD COMPLIANCE MATRIX

The project must maintain:

```text
docs/prd-compliance.md
```

Example:

| Requirement | Status | Evidence | Audit |
|---|---|---|---|
| Bed-level occupancy | DONE | module/test | PASS |
| Tenant independence | DONE | finance tests | PASS |
| Pagination | DONE | API tests | PASS |
| Custom auth | DONE | auth module | PASS |
| RLS/vendor isolation | DONE | security audit | PASS |

This document must be updated as development progresses.

---

# 113. FEATURE AUDIT DOCUMENTS

Every completed major feature should have an audit file:

```text
docs/audits/
├── auth-audit.md
├── property-audit.md
├── room-audit.md
├── bed-audit.md
├── tenant-audit.md
├── payment-audit.md
└── reports-audit.md
```

Each audit records:

- What was implemented
- What was tested
- Issues found
- Issues fixed
- Remaining technical debt
- Final score

---

# 114. FEATURE QUALITY SCORE

Each feature should receive a score:

```text
Functional correctness       /10
Business logic               /10
Security                     /10
Database integrity           /10
API quality                  /10
UI/UX                        /10
Performance                  /10
Code quality                 /10
Testing                      /10
PRD compliance               /10
```

Total:

```text
/100
```

Target:

```text
≥ 90 = acceptable
≥ 95 = production quality
< 90 = requires improvement
< 80 = feature cannot be signed off
```

Security P0/P1 issues override the numerical score.

---

# 115. FINAL SYSTEM AUDIT

Before V1 release, perform a complete system-wide audit.

Audit:

```text
Architecture
Database
Authentication
Authorization
RLS
API
Pagination
Financial logic
File storage
Mobile security
Performance
UI/UX
Accessibility
Testing
Documentation
Deployment
Secrets
Dependencies
```

---

# 116. RED TEAM AUDIT

Before production, the agent must actively attempt to break the application.

Try:

- Invalid IDs
- Unauthorized IDs
- Expired tokens
- Fake roles
- Modified requests
- Duplicate requests
- Concurrent requests
- Oversized pagination
- Invalid pagination
- SQL injection payloads
- Malicious file uploads
- Cross-owner access
- Direct endpoint access
- Hidden UI action invocation
- Repeated payment submission
- Repeated checkout
- Duplicate bed allocation

Any successful bypass is a release blocker.

---

# 117. FINAL ARCHITECTURE PRINCIPLE

The final architecture should resemble:

```text
                    M SQUARE MONOREPO
                           │
             ┌─────────────┴─────────────┐
             │                           │
          MOBILE                         API
       React Native                    Node/Nest
          Expo                           │
             │                           │
             │                    Application Layer
             │                           │
             │                       Domain Layer
             │                           │
             │                    Repository Ports
             │                           │
             │                    Infrastructure
             │                           │
             │                    PostgreSQL Adapter
             │                           │
             │                    PostgreSQL Database
             │
             └──────────── HTTPS ────────┘
```

Supabase, if used, sits underneath the infrastructure layer:

```text
Application
     ↓
Repository Interface
     ↓
PostgreSQL Adapter
     ↓
Supabase PostgreSQL
```

NOT:

```text
Application
     ↓
Supabase everywhere
```

---

# 118. VENDOR REPLACEMENT TEST

The architecture should pass this thought experiment:

> “Tomorrow Supabase disappears. Can we move to another PostgreSQL provider without rewriting the entire application?”

Expected answer:

```text
YES
```

Changes should primarily be limited to:

- Infrastructure configuration
- Database connection
- Storage adapter if applicable
- Deployment configuration

Business logic should remain intact.

---

# 119. MNC-LEVEL ENGINEERING WORKFLOW

The complete project lifecycle:

```text
PRD
 ↓
Architecture Review
 ↓
ADR
 ↓
Technical Design
 ↓
Database Design
 ↓
Security Design
 ↓
Feature Development
 ↓
Unit Tests
 ↓
Integration Tests
 ↓
Self Review
 ↓
Brutal Feature Audit
 ↓
Fixes
 ↓
Regression Tests
 ↓
Documentation
 ↓
Code Review
 ↓
Merge
 ↓
Staging Verification
 ↓
Security Audit
 ↓
Production Build
 ↓
Release Verification
```

---

# 120. AGENT MUST NOT DECLARE SUCCESS PREMATURELY

The agent must never say:

> “Feature completed.”

merely because code was generated.

Instead it must provide:

```text
Implementation completed.
Tests executed.
Audit completed.
Issues discovered.
Issues fixed.
Remaining issues.
PRD compliance.
Final status.
```

---

# 121. WHEN AGENT MUST STOP

Agent must stop and ask for clarification when:

- Business rule is ambiguous.
- Financial behavior is ambiguous.
- Permission behavior is ambiguous.
- Data ownership is ambiguous.
- A destructive migration is required but not approved.
- A security decision materially changes product behavior.
- A requirement conflicts with another requirement.

The agent must NOT silently invent business-critical behavior.

---

# 122. WHEN AGENT MAY PROCEED

Agent may make reasonable technical decisions for:

- Internal folder structure
- Naming
- Small implementation details
- UI spacing
- Internal utility design
- Test organization

provided that the decision:

- Does not change business behavior.
- Does not reduce security.
- Does not violate architecture.
- Does not violate the PRD.

Significant technical decisions must be documented as ADRs.

---

# 123. FINAL ENGINEERING MANTRA

The project must follow:

> **Small files. Small modules. Clear boundaries. Strong security. Explicit business logic. Database integrity. Tested features. Audited features. Replaceable infrastructure. Simple UX.**

And the most important rule:

> **“Build it, test it, try to break it, audit it, fix it, then call it done.”**

---

# 124. MASTER QUALITY GATE

M Square V1 cannot be released until all are true:

```text
[ ] Monorepo implemented
[ ] Modular architecture implemented
[ ] No source file > 500 LOC
[ ] Preferred file size maintained
[ ] Feature isolation implemented
[ ] Custom authentication implemented
[ ] Secure password hashing
[ ] Access/refresh token architecture
[ ] Session management
[ ] RBAC
[ ] Object-level authorization
[ ] Owner isolation
[ ] IDOR protection
[ ] Rate limiting
[ ] Input validation
[ ] Secure storage
[ ] PostgreSQL abstraction
[ ] Supabase isolated
[ ] Storage provider abstraction
[ ] Pagination on collection APIs
[ ] Server-side search
[ ] Server-side filtering
[ ] Deterministic sorting
[ ] Database indexes
[ ] Transactional critical workflows
[ ] Race-condition protection
[ ] Financial ledger model
[ ] Audit logging
[ ] Mobile-first UI
[ ] Loading/empty/error states
[ ] API client abstraction
[ ] Unit tests
[ ] Integration tests
[ ] Security tests
[ ] Workflow tests
[ ] Feature audits
[ ] Regression tests
[ ] Final red-team audit
[ ] PRD compliance matrix
[ ] ADR documentation
[ ] README
[ ] Environment documentation
[ ] Production build verified
[ ] No secrets committed
```

Only after all critical gates pass:

```text
M SQUARE V1
RELEASE APPROVED
```

# END OF ENGINEERING ADDENDUM