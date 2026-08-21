# Protocol 12: Adversarial Finding Verification

## Phase Goal
Actively challenge and falsify every suspected defect generated during Phases 05 through 11. **Prove the finding wrong before accepting it as confirmed.**

---

## 1. Adversarial Challenge Protocol (The 7-Point Falsification)
For every suspected finding:

1. **Database Layer Defense**: Search database migrations & schema for unique constraints, checks, foreign keys, or triggers.
2. **Upstream Gateway Defense**: Search global pipes, validation middleware, and auth guards.
3. **Storage Layer Defense**: Search base repositories and query builder plugins.
4. **Type-System Defense**: Verify if the compiler guarantees the state is impossible.
5. **Reachability Defense**: Verify if the route/function is actually mounted and reachable in production.
6. **Spec Invariant Defense**: Verify if this is an explicit requirement or reviewer assumption.
7. **Real Bug vs Code Style**: Verify if this causes actual runtime failure, security hole, or data corruption.

---

## 2. Verification Outcomes
- **CONFIRMED**: Counter-arguments completely refuted. Real reproducible failure path exists.
- **LIKELY**: Strong structural defect; edge conditions difficult to trigger statically.
- **UNCERTAIN**: Inconclusive code evidence.
- **REJECTED**: Disproved. Upstream/downstream protection or DB constraint makes it safe.

---

## 3. Required Output Artifact
Produce verification records conforming to [`schemas/verification.md`](file:///schemas/verification.md).

Transition to: `[FINDINGS_VERIFIED]`.
