# ADR-010: Operational Dashboard & Reporting Architecture

## Status
Accepted

## Context
M Square PG Owner SaaS requires an operational intelligence dashboard and reporting suite. The PG Owner needs a unified, real-time command center to monitor business performance (occupancy, active residents, billing collections, outstanding dues, mess consumption, operational expenses, and audit activity) without manually navigating deep physical inventory hierarchies (Property → Building → Floor → Room → Bed).

## Decision Drivers
1. **Zero Fake Metrics**: All metrics must be aggregated directly from authoritative PostgreSQL database tables. No hardcoded or mock business data.
2. **Derivation over Materialization**: Avoid duplicate materialized counter tables which risk becoming out-of-sync. Compute metrics using efficient SQL aggregations.
3. **Tenant & Property Scoping**: All reporting queries MUST include `organization_id` (from trusted `RequestContext`) and optional `property_id` filters.
4. **Integer-Paise Monetary Precision**: Financial aggregations must use exact PostgreSQL numeric fields and integer-paise calculations. Never cast financial columns to `::float`.
5. **Operational UX Alignment**: The dashboard is a task-centric command center with direct operational CTAs and activity streams.

## Architectural Decisions

### 1. Database Aggregation Strategy
- **Occupancy**: Calculated dynamically from active `bed_allocations` (`status = 'ACTIVE'`) joined with physical inventory tables (`beds`, `rooms`, `floors`, `buildings`, `properties`). Beds are categorized into `AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, and `INACTIVE`.
- **Resident Metrics**: Aggregated from `residents` and `stays` tables for active, inactive, checked-in, checked-out, and transfers during the selected period.
- **Billing & Collections**: Aggregated from `invoices` and `payments` tables using exact `SUM(total_amount)`, `SUM(paid_amount)`, and `SUM(balance_due_amount)` with integer-paise arithmetic at application boundary.
- **Mess Metrics**: Aggregated from `mess_subscriptions`, `mess_meals`, `mess_inventory`, `mess_procurements`, and `mess_expenses`.
- **Expenses**: Aggregated from `mess_expenses` and categorized operational expenses.

### 2. Date Range Semantics
Supports predefined date ranges (`TODAY`, `THIS_WEEK`, `THIS_MONTH`, `LAST_MONTH`, `CUSTOM`). Queries compute explicit ISO start/end timestamp bounds in local organization timezone context.

### 3. TanStack Query Cache Key Contract
Mobile query keys must explicitly incorporate `organizationId`, `propertyId`, and date bounds:
`['reporting-dashboard', organizationId, propertyId, startDate, endDate]`
Switching `selectedPropertyId` or date range instantly invalidates and refetches reporting data without stale cross-property contamination.

## Consequences
- Single source of truth for all business operational KPIs.
- High performance via database-level aggregate SQL queries (no N+1 JavaScript loops).
- Strict multi-tenant security and property context safety.
