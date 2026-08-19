# ADR-008: Mess Management Domain Architecture, Inventory Ledger & Consumption Idempotency

## Status
Accepted

## Context
M7.2 + F2.2 requires a complete Mess Management domain for the M Square PG Management platform.
Owners require flexible mess configuration including Central vs. Per-Block/Property scope, configurable meal billing modes (Per Meal / Monthly), dynamic meal plans and menus, stay-scoped resident mess subscriptions, idempotent meal consumption tracking, kitchen inventory with immutable transaction ledgers, vendor management, atomic procurement, and mess operational expenses.

## Key Architectural Decisions

### 1. Mess Scope & Mapping Model
- A Mess configuration supports two scope types: `CENTRAL` (serves all properties/blocks in the organization) and `PER_BLOCK` (serves specific assigned `building_id`s/blocks).
- `mess_building_assignments` maintains the mapping `(mess_id, building_id, organization_id)`.
- Unique partial index ensures that when scope is `PER_BLOCK`, a building/block can be assigned to at most one active Mess within an organization.

### 2. Stay-Scoped Resident Subscriptions & Immutable Pricing
- Mess Subscriptions (`resident_mess_subscriptions`) are bound to `stay_id` (consistent with ADR-007).
- When meal plan prices change, historical subscription prices remain frozen via `price_at_subscription` (`numeric(12,2)`).
- When a resident checks out, active subscriptions transition to `COMPLETED`. A new stay creates a distinct subscription record.

### 3. Consumption Idempotency & Concurrency Safety
- Meal consumption records (`mess_meal_consumptions`) track daily resident meal taking.
- Database uniqueness constraint: `UNIQUE (subscription_id, consumption_date, meal_type_id)`.
- Concurrent or duplicate attempts to mark consumption for the same resident, meal type, and date are rejected at the database level.

### 4. Inventory Ledger Accounting Model
- `mess_inventory_items` maintains current stock balance, minimum stock, reorder level, and status (`IN_STOCK` | `LOW_STOCK` | `OUT_OF_STOCK`).
- Stock changes MUST NEVER be raw field mutations without audit. All stock movements are logged in `mess_inventory_transactions` with transaction types: `OPENING_STOCK`, `PURCHASE`, `ADJUSTMENT_IN`, `ADJUSTMENT_OUT`, `CONSUMPTION`, `WASTAGE`.
- Row-locking (`FOR UPDATE`) on `mess_inventory_items` during stock movements guarantees atomicity and concurrency safety. Negative stock balance is strictly forbidden unless explicitly authorized by adjustment.

### 5. Atomic Procurement to Inventory Integration
- Recording a procurement (`mess_procurements`) creates line items (`mess_procurement_items`) and automatically generates `PURCHASE` inventory transactions and stock updates within the same atomic `UnitOfWork` database transaction.
- If inventory updating fails, the procurement transaction rolls back completely.

### 6. Strict Monetary Precision
- Persistent monetary fields (`price`, `price_at_subscription`, `total_amount`, `amount`, `unit_price`, `total_price`) use PostgreSQL `numeric(12,2)`.
- Floating point money calculations are strictly prohibited.

## Consequences
- Clean separation between Mess business configuration, meal operational tracking, inventory ledger, vendor procurement, and expenses.
- 100% auditable inventory ledger and financial procurement records.
- Complete backward compatibility with M1-M7.1 and F0-F2.1.
