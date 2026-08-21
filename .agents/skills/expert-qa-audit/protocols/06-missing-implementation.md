# Protocol 06: Missing Implementation Audit

## Phase Goal
Detect required functionality, validations, constraints, or workflows that are specified or expected but **completely absent** from the codebase.

---

## 1. Exhaustive Search Invariants (Anti-False-Positive Rules)
Before declaring an implementation "MISSING":
1. **Search Monorepo**: Search other packages/modules for shared helpers or middleware.
2. **Check Database Layer**: Verify if the database schema or trigger already handles the requirement.
3. **Check Injected Framework Interceptors**: Check global guards, validation pipes, and response interceptors.
4. **Check SDK / Third-Party Wrappers**: Verify if an imported library natively performs the function.

---

## 2. Common Missing Code Vectors
- Missing tenant scoping filter (`organization_id` filter omitted in query).
- Missing database unique index for business uniqueness invariants.
- Missing rollback logic when secondary asynchronous operations fail.
- Missing authorization checks on entity retrieval or mutation.
- Missing frontend parameter passing to newly introduced backend fields.

---

## 3. Required Output Artifact
For every confirmed missing functionality, create a finding record following [`schemas/finding.md`](file:///schemas/finding.md) with category `MISSING_IMPLEMENTATION`.
