# Protocol 10: State Transition & Lifecycle Audit

## Phase Goal
Audit all entities governed by lifecycles or state machines (e.g., Invoices: `DRAFT -> ISSUED -> PAID | CANCELLED`, Tasks: `TODO -> IN_PROGRESS -> COMPLETED | CANCELLED`).

---

## 1. Audit Checkpoints

1. **Explicit State Transition Graph**:
   - Construct the valid state transition matrix.
2. **Invalid State Transition Protection**:
   - Can a `CANCELLED` task be marked `COMPLETED`?
   - Can an `ALREADY_PAID` invoice be paid again or edited?
   - Is transition guarded in business logic or database constraint?
3. **State Side-Effect Reversibility / Cleanups**:
   - When a task is cancelled, are notifications resolved/dismissed?
   - When a stay is checked out, is the allocated bed freed atomically?
4. **Terminal State Invariants**:
   - Are terminal states (`COMPLETED`, `CANCELLED`, `DELETED`) immutable?

---

## 2. Required Output Artifact
Create finding records following [`schemas/finding.md`](file:///schemas/finding.md) with category `STATE_CORRUPTION`.
