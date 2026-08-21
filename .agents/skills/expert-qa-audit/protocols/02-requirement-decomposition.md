# Protocol 02: Requirement Decomposition

## Phase Goal
Deconstruct high-level user specifications, feature descriptions, PR claims, or business rules into **discrete, atomic, and verifiable requirements**.

---

## 1. Execution Steps

1. **Intake & Scope Definition**:
   - Collect user prompts, PR descriptions, issue tickets, or specifications for the feature under audit.
2. **Atomic Breakdown**:
   - Break every feature into individual expectations:
     - Authentication & Authorization expectations
     - Input parameter validation & sanitization
     - Domain invariants & business calculations
     - Multi-tenant isolation invariants
     - Concurrency & duplicate prevention invariants
     - State mutation & transaction boundaries
     - Downstream side-effects (Events, Notifications, Cache invalidation)
     - Failure, rollback, and error reporting behavior
3. **Classify Requirements**:
   - `EXPLICIT_SPEC`: Directly mentioned in user requirements.
   - `TECHNICAL_EXPECTATION`: Essential engineering standard (e.g., input sanitization, transactional rollback, multi-tenant isolation).
   - `UNKNOWN_ASSUMPTION`: Ambiguous business logic (must be marked as assumption, never invented as a bug).

---

## 2. Example Decomposition
*Feature Claim*: "Push notifications for created tasks are fully working."
*Atomic Requirements*:
- `REQ-01`: Push token registration endpoint accepts valid device token and stores with user/org ID.
- `REQ-02`: Task creation triggers push dispatcher with task title, body, and deep link route.
- `REQ-03`: Push dispatcher filters for active devices of the organization and excludes invalid tokens.
- `REQ-04`: Mobile app handles permission prompt, retrieves token, and syncs on login.
- `REQ-05`: Mobile app notification response listener deep links directly to `/(owner)/tasks/:id`.
- `REQ-06`: Background/lockscreen presentation configuration is set to MAX importance with sound.

---

## 3. Required Output Artifact
Produce a populated ledger conforming to [`schemas/requirement-ledger.md`](file:///schemas/requirement-ledger.md).

Transition to: `[REQUIREMENTS_DECOMPOSED]`.
