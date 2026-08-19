# ADR-007: Stay-Scoped Resident Commercial Architecture & Precision Money Handling

## Status
Accepted

## Context
In M7.1 + F2.1 Resident Commercial Management, owners must configure resident rent, security deposit, billing cycles, facility assignments, and additional charges.
A critical domain challenge is preserving historical commercial integrity across multiple resident stays over time (e.g., Resident stays in Room 101, checks out, and returns months later for a new stay in Room 205).

Furthermore, financial calculation precision requires a strict policy prohibiting floating-point numbers.

## Decision

### 1. Commercial Scope & Aggregate Relationship
The Commercial Agreement (`resident_commercial_agreements`) is **STAY-SCOPED**.
- Every commercial agreement is bound to a specific `stay_id`, as well as `resident_id` and `organization_id`.
- A `Resident` may have multiple historical `Stays` over time. Each stay maintains its own independent commercial agreement history.
- Within an active `Stay`, price changes create a new `CommercialAgreement` revision with `status = 'ACTIVE'`, marking the previous agreement `status = 'SUPERSEDED'`.
- At Checkout (`actual_checkout_date` set), the active commercial agreement for that stay transitions to `status = 'TERMINATED'`.
- Database constraint: At most ONE active commercial agreement per `stay_id` (`CREATE UNIQUE INDEX idx_unique_active_commercial_per_stay ON resident_commercial_agreements (stay_id) WHERE status = 'ACTIVE'`).

### 2. Resident Facilities & Additional Charges
- `resident_facilities` are bound to `(stay_id, resident_id, organization_id, facility_id)`. Active facility assignments apply to the active stay and are deactivated upon checkout.
- `resident_additional_charges` are bound to `(stay_id, resident_id, organization_id)`.

### 3. Precision Money Handling Strategy
- Floating-point calculations (`number` floating arithmetic) are strictly forbidden for money in the database and service logic.
- PostgreSQL Column Type: `numeric(12,2)` for all monetary columns (`base_rent_amount`, `security_deposit_amount`, `monthly_charge`, `amount`).
- TypeScript / API Layer: Serialized as explicit fixed-precision numeric values (e.g. `8000.00`). Input DTOs validate non-negative values (`@Min(0)`), GT 0 for charges (`@Min(0.01)`), and standard 2 decimal places.

## Consequences
- Historical commercial agreements for past stays remain completely intact and auditable.
- Physical room price updates never affect existing active resident agreements.
- Multi-stay resident re-entry generates clean, independent commercial terms per stay.
