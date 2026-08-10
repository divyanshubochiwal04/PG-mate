# M SQUARE — SYSTEM ARCHITECTURE SPECIFICATION

This document outlines the architectural blueprint, design patterns, and systemic data flows for the **M Square PG & Hostel Management System**.

---

## 1. Architectural Overview

M Square is built using a **Clean Architecture (Hexagonal Architecture / Ports & Adapters)** model organized inside a monorepo. The core goal of this architecture is **Infrastructure Decoupling**, ensuring that business rules are entirely independent of third-party vendors (like Supabase), frameworks (React Native, Expo, NestJS), and databases (PostgreSQL, Neon, AWS RDS).

### Key Architectural Pillars:
1.  **Inward Dependency Flow**: Dependencies flow strictly from outer delivery mechanisms (Mobile App, HTTP API) toward stable business abstractions (Domain Entities). The Domain layer must never import files from any other package.
2.  **Dependency Inversion**: Outer layers (e.g. database adapters) implement interfaces (Ports) defined in the inner layers (Domain/Application).
3.  **Infrastructure Ignorance**: The core business logic operates as if the database is in-memory. All persistence operations are routed through abstract interfaces.
4.  **Transactional Integrity**: Critical actions (bookings, checkouts, payments) utilize atomic database transactions managed at the application service boundary.

---

## 2. Layered Architecture

The system is split into three main concentric circles of responsibility:

```mermaid
graph TD
    subgraph External ["External Infrastructure (Outer Layer)"]
        UI["apps/mobile (Expo Client)"]
        DB["PostgreSQL (Supabase/Neon/RDS)"]
        S3["Object Storage (S3/Supabase Storage)"]
    end

    subgraph Adapters ["Interface & Data Adapters (Middle Layer)"]
        Controller["apps/api (Controllers, Guards)"]
        DbRepo["packages/database (Postgres Adapters)"]
        StorageAdapter["packages/database (S3/Supabase Adapters)"]
    end

    subgraph Core ["Application & Domain Core (Inner Layer)"]
        Contracts["packages/contracts (DTOs)"]
        Validation["packages/validation (Schemas)"]
        DomainPorts["packages/domain/src/ports (Interfaces)"]
        DomainEntities["packages/domain/src (Business Entities)"]
    end

    UI -->|HTTPS API Requests| Controller
    Controller -->|Use Cases| DomainEntities
    Controller -->|DTO Validation| Validation
    Controller -->|DTO Types| Contracts
    DbRepo -->|Implements Ports| DomainPorts
    StorageAdapter -->|Implements Ports| DomainPorts
    DomainEntities -->|Defines Ports| DomainPorts
    DbRepo -->|Reads/Writes SQL| DB
    StorageAdapter -->|Saves Files| S3
```

---

## 3. Dependency Inversion in Action

To prevent Supabase or PostgreSQL code from leaking into the core application, all database queries are hidden behind **Repository Ports**. 

### Compile-time Dependency vs. Run-time Execution Flow:
The diagram below illustrates how compilation dependencies flow inward, while execution control flows outward to database infrastructure:

```mermaid
sequenceDiagram
    participant AppService as API Application Service
    participant RepoPort as Repository Port (Interface)
    participant PostgresRepo as Postgres Repository Adapter (Infrastructure)
    participant DB as PostgreSQL Database

    Note over AppService,RepoPort: Compile-Time Dependency: Inward
    Note over RepoPort,PostgresRepo: Runtime Dependency: Injected (Outward)

    AppService->>RepoPort: getTenantById(id)
    RepoPort->>PostgresRepo: Execute Query (via runtime binding)
    PostgresRepo->>DB: SELECT * FROM tenants WHERE id = $1
    DB-->>PostgresRepo: Row Data
    PostgresRepo-->>RepoPort: Map Row to Tenant Domain Object
    RepoPort-->>AppService: Return Tenant Entity
```

---

## 4. Custom Authentication & Token Security Architecture

Supabase Auth is bypassed. The application manages sessions and tokens internally, utilizing `Argon2id` for credential storage, JWTs for short-lived access tokens, and a database-backed refresh token rotation family database schema.

### Token Rotation & Reuse Detection Sequence
If an attacker steals a refresh token, they will try to reuse it. The system detects this immediately by checking if the token has already been marked as rotated, prompting session invalidation:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Mobile Client (User)
    actor Attacker as Attacker (Intercepted Token)
    participant API as API Auth Module
    participant DB as Sessions & Tokens Database

    Note over Client,API: Normal Refresh Flow
    Client->>API: POST /refresh (Refresh Token A)
    API->>DB: Fetch Session & Verify Token A (Unused)
    DB-->>API: Valid Session Found
    API->>DB: Mark Token A as USED/ROTATED
    API->>DB: Create Refresh Token B (Linked to Family)
    API-->>Client: Return Access Token + Refresh Token B

    Note over Attacker,API: Attacker Attempts to Use Expired/Rotated Token A
    Attacker->>API: POST /refresh (Stolen Refresh Token A)
    API->>DB: Fetch Session & Verify Token A (Marked as ROTATED)
    DB-->>API: Token Reuse Violation Flagged!
    API->>DB: DELETE / REVOKE Entire Session & Token Family
    API-->>Attacker: Return 401 Unauthorized
    Note over Client,API: Next request by User (Client) with Token B fails because session was revoked
    Client->>API: POST /refresh (Refresh Token B)
    API-->>Client: Return 401 Unauthorized (Triggers Force Logout UX)
```

---

## 5. Ledger-Based Financial Architecture

Balances are never stored as mutable properties that are direct-edited. Instead, the application implements a double-entry ledger database pattern.

### Balance Calculation & Correction Flow:
1.  **Rent Generation**: Creates a `DEBIT` record (charge).
2.  **Tenant Payment**: Creates a `CREDIT` record (payment).
3.  **Balance Derivation**: The system sums the ledger records (`charges - payments = balance`).
4.  **Payment Reversal**: If a check bounces, the payment is **never** deleted. Instead, a `REVERSAL` debit entry is written, preserving historical auditability.

```mermaid
graph LR
    subgraph LedgerEntries ["Ledger Transactions Database"]
        E1["Charge Entry: DEBIT $500 (Rent Oct)"]
        E2["Payment Entry: CREDIT $500 (Paid Oct)"]
        E3["Charge Entry: DEBIT $500 (Rent Nov)"]
        E4["Payment Entry: CREDIT $500 (Bounced Payment)"]
        E5["Reversal Entry: DEBIT $500 (Reversal Oct Payment)"]
    end

    subgraph DynamicEngine ["Ledger Engine"]
        Engine["Summation Logic (Debits - Credits)"]
    end

    E1 --> Engine
    E2 --> Engine
    E3 --> Engine
    E4 --> Engine
    E5 --> Engine

    Engine -->|Calculates| Balance["Current Tenant Balance: $1000 Due"]
```

---

## 6. Concurrency & Allocation Architecture

PG applications suffer from double-booking risks if two managers try to allocate the same bed simultaneously. 

### Database-Level Concurrency Control
Rather than validating vacancy in Node memory, M Square employs row-level locks on the `beds` database table within the booking transaction boundary.

```mermaid
sequenceDiagram
    actor ManagerA as Manager A (Screen 1)
    actor ManagerB as Manager B (Screen 2)
    participant API as API Application Layer
    participant DB as PostgreSQL

    ManagerA->>API: Allocate Bed 42 to Tenant X
    ManagerB->>API: Allocate Bed 42 to Tenant Y
    
    Note over API,DB: Transaction 1 Started (Manager A)
    API->>DB: SELECT * FROM beds WHERE id = 42 FOR UPDATE
    Note right of DB: Bed 42 Locked
    
    Note over API,DB: Transaction 2 Started (Manager B)
    API->>DB: SELECT * FROM beds WHERE id = 42 FOR UPDATE
    Note right of DB: Transaction 2 BLOCKED. Waiting for Lock.

    API->>DB: INSERT INTO allocations (bed_id, tenant_id) VALUES (42, X)
    API->>DB: UPDATE beds SET status = 'occupied' WHERE id = 42
    API->>DB: COMMIT Transaction 1
    Note right of DB: Bed 42 Lock Released. Transaction 1 Done.

    Note over API,DB: Transaction 2 Resumes
    DB-->>API: Returns Bed 42 (Status: occupied)
    API->>API: Check status matches 'vacant'? (FAIL)
    API->>DB: ROLLBACK Transaction 2
    API-->>ManagerB: Return 409 Conflict ("Bed already occupied")
```

---

## 7. Architecture Compliance Checklist

To preserve this architecture during execution, developers must review new features against the following requirements:
*   [ ] **Domain Isolation**: Code in `packages/domain` must not import any modules from other packages or framework libraries.
*   [ ] **No Direct SQL**: Controllers and API services must not execute raw SQL or call knex/prisma/supabase clients. All queries must route through the declared `Repository` interface.
*   [ ] **Private File Access**: The frontend must never have access to raw bucket URLs. Documents must be retrieved via short-lived signed URLs generated by the `StorageProvider`.
*   [ ] **Atomicity**: Features modifying multiple entities (e.g. allocations, balances, states) must wrap changes inside a database transaction adapter.
