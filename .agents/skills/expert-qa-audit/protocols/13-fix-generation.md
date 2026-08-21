# Protocol 13: Minimal Safe Fix Generation

## Phase Goal
Construct surgical, production-ready, and minimal code patches for all **CONFIRMED** findings.

---

## 1. Fix Construction Invariants
1. **Minimal Blast Radius**: Fix only the root cause. Do NOT refactor surrounding unrelated code.
2. **Architectural Idiom**: Follow existing repository patterns (e.g., Kysely query builders, React Query hook invalidations).
3. **Database Precedence**: If the defect is a missing constraint (e.g. duplicate prevention), propose a database migration with `UNIQUE INDEX` rather than relying only on application-level checks.
4. **Zero Unnecessary Dependencies**: Do not introduce external libraries unless absolutely mandatory.
5. **Regression Test Included**: For every CRITICAL or HIGH finding, include an automated regression test script or test case.

---

## 2. Fix Patch Format
Provide fixes either as exact file replacements or unified diffs:
```diff
- old flawed code
+ new safe code
```

---

## 3. Required Output Artifact
Populate fix and regression test sections in each confirmed finding record conforming to [`schemas/finding.md`](file:///schemas/finding.md).

Transition to: `[FIXES_GENERATED]`.
