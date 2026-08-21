# Knowledge Base: Common Software Failure Patterns

This catalog documents concrete failure patterns to look for during deep code auditing.

---

## 1. Multi-Tenant & Security Hazards
1. **Unscoped Read/Write Queries**:
   - *Symptom*: `SELECT * FROM tasks WHERE id = :id` without `AND organization_id = :orgId`.
   - *Failure*: Tenant A can access or overwrite Tenant B's data by guessing UUID/ID.
2. **Missing Token Extraction Sanitization**:
   - *Symptom*: Decorator returns object `{ id, ... }` but controller expects string `id: string`.
   - *Failure*: Postgres driver attempts `'[object Object]'::uuid` causing runtime 500 error.
3. **Client-Trusted Security Assertions**:
   - *Symptom*: Frontend sends `is_admin: true` or `discount_amount: 500` and backend accepts directly.
   - *Failure*: Parameter tampering allows unauthorized privilege elevation or price modification.

---

## 2. Concurrency & Race Hazards
1. **Check-Then-Act (TOCTOU) Race**:
   - *Symptom*: `const existing = find(); if (!existing) insert();`
   - *Failure*: Two concurrent requests both pass the `if (!existing)` check and insert duplicates unless a database unique constraint or serializable transaction exists.
2. **Unsynchronized Inventory / Counter Decrement**:
   - *Symptom*: `item.quantity -= 1; update(item);`
   - *Failure*: Lost updates when two users purchase the last item simultaneously. Requires atomic `UPDATE items SET quantity = quantity - 1 WHERE id = :id AND quantity >= 1`.
3. **Non-Idempotent Webhooks & Retries**:
   - *Symptom*: Payment webhook inserts payment without checking `dedupe_key` or `transaction_reference`.
   - *Failure*: Network retries cause double credit or duplicate receipt generation.

---

## 3. Transactional & State Hazards
1. **Unwrapped Multi-Table Mutations**:
   - *Symptom*: Creating Resident, assigning Bed, and generating Invoice in separate sequential queries without a database transaction (`trx`).
   - *Failure*: If Invoice creation crashes, Resident and Bed remain allocated with no invoice (dirty state).
2. **Missing Outbound Event Atomicity (Outbox Pattern)**:
   - *Symptom*: Database commits, then external HTTP API is called. If server crashes between them, external sync is lost forever.
3. **Unvalidated State Skipping**:
   - *Symptom*: Transitioning an entity directly from `TODO` to `RESOLVED` bypassing `IN_PROGRESS` or required approval.

---

## 4. API & Integration Envelope Hazards
1. **Double Wrapped / Unwrapped API Envelopes**:
   - *Symptom*: Backend wraps response in `{ success: true, data: T }`, client API client expects raw `T` or forgets to unwrap `response.data.data`.
   - *Failure*: UI components receive `{ success: true, data: [...] }` instead of `[...]` array, causing empty lists or crashes.
2. **Pagination Offset Math Errors**:
   - *Symptom*: `offset = page * pageSize` instead of `(page - 1) * pageSize`.
   - *Failure*: Page 1 skips the first `pageSize` items completely.
3. **Floating Point Monetary Calculations**:
   - *Symptom*: `let total = price * 0.18;` using raw JavaScript IEEE 754 floats.
   - *Failure*: `0.1 + 0.2 = 0.30000000000000004` causing ledger imbalances.
