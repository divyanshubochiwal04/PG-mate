# Protocol 11: Concurrency & Idempotency Audit

## Phase Goal
Audit operations susceptible to concurrent execution, double-click submissions, network retries, and race conditions.

---

## 1. Concurrency Checkpoints

1. **Check-Then-Act Races (TOCTOU)**:
   - Does code check for existing record in step 1, then insert in step 2 without database-level uniqueness constraint (`UNIQUE INDEX`)?
2. **Idempotency on Creation & Payments**:
   - Do payment webhooks or critical creation endpoints utilize an idempotency key / `dedupe_key`?
3. **Atomic Decrements / Inventory Stock**:
   - Are stock quantities decremented using database atomic expressions (`quantity = quantity - 1 WHERE quantity >= 1`) or vulnerable read-modify-write patterns?
4. **Optimistic / Pessimistic Locking**:
   - Are high-contention resources locked using `SELECT ... FOR UPDATE` or version numbers where required?

---

## 2. Rule on Reporting
Do NOT report a race condition without constructing a concrete, step-by-step interleaving scenario of two concurrent threads.

---

## 3. Required Output Artifact
Create finding records following [`schemas/finding.md`](file:///schemas/finding.md) with category `CONCURRENCY_RACE`.
