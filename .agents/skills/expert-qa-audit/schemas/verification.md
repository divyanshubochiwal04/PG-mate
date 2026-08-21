# Schema: Finding Verification (`verification.md`)

Use this schema in Phase 12 (Adversarial Finding Verification) to document challenges against suspected defects.

```markdown
# Adversarial Finding Verification: `VERIF-FIND-<NUMBER>`

## Target Finding
- **Finding ID**: `FIND-<NUMBER>`
- **Suspected Issue**: `<Short summary of suspected bug>`
- **Original Claimed Location**: `<file:line>`

---

## Adversarial Challenge Matrix (7-Point Falsification)

| # | Challenge Angle | Investigation Query / Code Checked | Counter-Evidence Found? | Verdict on Angle |
|---|---|---|---|---|
| 1 | **Database Invariant Check**: Does a DB constraint, trigger, or unique index already prevent this? | `packages/database/src/schema/...` | `No unique constraint on column (X)` | VULNERABLE |
| 2 | **Upstream Protection Check**: Does an upstream guard, interceptor, or middleware sanitize or reject this? | `apps/api/src/common/guards/...` | `Guard only checks JWT, not tenant ownership` | VULNERABLE |
| 3 | **Downstream Protection Check**: Does a repository or ORM hook handle or catch this? | `packages/database/src/repos/...` | `No catch block, error bubbles to 500` | VULNERABLE |
| 4 | **Type System Guarantee**: Does the compiler / type system prevent this at build time? | `packages/contracts/...` | `DTO permits optional null/undefined` | VULNERABLE |
| 5 | **Reachability Test**: Is this code path actually callable in production? | `routes, controllers, exports` | `Directly mapped to POST /api/v1/...` | REACHABLE |
| 6 | **True Requirement Invariant**: Does the specification strictly require this or is it an alternative valid design? | `Requirements decomposition` | `Explicitly required in REQ-04` | INVARIANT_VIOLATED |
| 7 | **Alternative Style vs Real Bug**: Is this merely subjective style difference or functional defect? | `Runtime impact analysis` | `Causes data corruption under concurrent load` | REAL_DEFECT |

---

## Adversarial Verification Outcome

### Final Status: `<CONFIRMED | LIKELY | UNCERTAIN | REJECTED>`

- **CONFIRMED**: Counter-arguments completely refuted. Code proof proves reproducible failure path.
- **LIKELY**: Strong structural evidence of defect; edge conditions hard to trigger in mock environment.
- **UNCERTAIN**: Inconclusive code evidence; behavior depends on third-party runtime or uninspected module.
- **REJECTED**: Proved wrong. Upstream/downstream protection or database constraint already safely handles the scenario.

### Rejection Rationale (if REJECTED):
`<Detailed explanation with file and line references showing why the suspected finding is NOT a real bug>`
```
