# Schema: Requirement Ledger (`requirement-ledger.md`)

Use this schema to track and reconcile atomic requirements throughout the audit lifecycle.

```markdown
# Requirement Audit Ledger

## Scope Summary
- **Target Feature**: <Feature Name>
- **Total Atomic Requirements**: <Number>
- **Reconciliation Status**: <IN_PROGRESS | RECONCILED>

---

## Atomic Requirements Ledger Table

| REQ-ID | Category | Atomic Requirement Statement | Source / Origin | Status | Verified Evidence (Files & Lines) | Associated Findings |
|---|---|---|---|---|---|---|
| REQ-01 | AUTH | Device request must be authenticated via valid token | User Spec / Technical | VERIFIED | `src/auth.guard.ts:24-38` | None |
| REQ-02 | VALIDATION | Request payload must validate all mandatory fields | Spec | FAILED | `src/dto.ts:12-25` | FIND-01 |
| REQ-03 | ISOLATION | Operations must be strictly scoped to organization_id | System Invariant | VERIFIED | `src/repo.ts:89-102` | None |
| REQ-04 | CONCURRENCY | Concurrent duplicate requests must be rejected | Technical | UNCERTAIN | `src/service.ts:140-155` | HYP-01 |

---

## Status Definitions
- `VERIFIED`: Complete, reachable implementation exists and code proof satisfies the requirement under normal and failure paths.
- `PARTIAL`: Implementation exists but is missing critical branches, edge-case handling, or integration wires.
- `FAILED`: Implementation is wrong, broken, bypassable, or actively violates the requirement.
- `UNCERTAIN`: Code evidence is inconclusive or insufficient to prove correctness or defect.
- `NOT_APPLICABLE`: Requirement explicitly does not apply to this system/context (reason required).
```
