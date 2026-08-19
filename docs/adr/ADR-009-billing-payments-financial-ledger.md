# ADR-009: Resident Billing, Payments, and Financial Ledger Architecture

## Status
Accepted

## Context
The M Square PG Management system requires a robust, operational financial domain covering Resident Monthly Billing, Payment Collection, Payment Allocations, Receipts, and Financial Ledger Summaries.
The system is an operational PG software platform (not a generic accounting software). Owners need fast, predictable, one-tap payment collection and accurate tracking of rent, facilities, mess subscriptions, extra charges, and outstanding balances per resident stay.

## Architectural Principles & Decisions

### 1. Numeric Precision & Floating-Point Prohibition
- **Database Storage**: All monetary fields must use PostgreSQL `numeric(12,2)`.
- **Application Computation**: All money amounts in JavaScript/TypeScript business logic must be computed using integer currency units (paise: `Math.round(amount * 100)`) or string-based decimal representation to eliminate IEEE 754 floating-point rounding errors.

### 2. Stay-Scoped Financial Isolation & Immutability
- Financial records (`invoices`, `invoice_items`, `payments`, `payment_allocations`, `receipts`) are strictly tied to `organization_id`, `resident_id`, and `stay_id`.
- Re-admission of a resident creates a new `stay_id`. Financial records for Stay B must never alter, overwrite, or mutate Stay A records.
- Invoices are snapshot-based. Once issued, invoice line items copy exact descriptions and amounts. Subsequent commercial agreement or mess plan rate changes do not affect previously issued invoices.

### 3. Payment Idempotency & Concurrency Locking
- Payment collection requires an `idempotency_key` header/field.
- Partial unique index `idx_uq_payment_idempotency` on `payments (organization_id, idempotency_key)` prevents double collection on network retries or double taps.
- Concurrent payment allocations execute inside a `UnitOfWork` transaction using `FOR UPDATE` row locks on target invoices.

### 4. Accounting & Allocation Rules
- **Invoice Status Lifecycle**: `DRAFT` → `ISSUED` → (`PARTIALLY_PAID` | `PAID`) or `CANCELLED` | `OVERDUE`.
- **Payment Allocation**: Payments are allocated against outstanding invoices in chronological order (oldest due invoice first) or targeted specifically.
- **Immutability**: Payments cannot be deleted. If a payment is reversed, a offset payment reversal record is created with an audit trail.

### 5. Multi-Tenant Composite Key Scoping
- All financial queries filter strictly by `organization_id`.
- Composite foreign keys (e.g. `FOREIGN KEY (organization_id, stay_id) REFERENCES stays(organization_id, id)`) guarantee database-enforced multi-tenant isolation without data leakage.

## Consequences
- Guarantees 100% financial auditability, zero floating-point drift, zero double collection, and strict multi-tenant isolation.
- Simplifies operational reporting for PG owners with instant dues calculation and one-tap receipt generation.
