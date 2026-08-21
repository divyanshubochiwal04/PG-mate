# Knowledge Base: Audit Taxonomy & Classifications

## 1. Severity Classification

Every finding must be assigned an unambiguous severity based on blast radius and failure consequence:

| Severity | Definition | Concrete Examples |
|---|---|---|
| **CRITICAL** | Direct security compromise, data loss/corruption, financial discrepancy, complete feature blockage, or unhandled crash affecting all users. | Cross-tenant data leak, unauthenticated privilege elevation, missing DB transaction causing dirty writes, double-billing bug. |
| **HIGH** | Major functional defect, broken core requirement, unhandled runtime exception under expected conditions, or bypassable business rule. | API parameter ignored causing default fallback, notification not delivered on critical event, invalid state transition permitted. |
| **MEDIUM** | Edge case failure, missing idempotency under network retry, inconsistent UI/API contract, unhandled boundary input. | Duplicate record created on double-click, pagination offset calculation off-by-one on last page, unlocalized error message. |
| **LOW** | Minor inconsistency, suboptimal fallback, deprecated usage without immediate risk, redundant query execution. | Missing index on low-volume table, redundant sanitization call, imprecise log level. |
| **INFORMATIONAL** | Architectural note, code organization suggestion, or non-functional observation. | Suggestion to extract common helper, design pattern alignment. |

---

## 2. Requirement Status Taxonomy

| Status | Code Evidence Requirement |
|---|---|
| **VERIFIED** | Direct code citation proves full reachability, correct business logic, input validation, and expected side effects under all paths. |
| **PARTIALLY_VERIFIED** | Code exists and works for happy path, but failure paths, rollbacks, or downstream wires are missing or unverified. |
| **FAILED** | Code is explicitly missing, unreachable, defective, or produces incorrect outputs/side-effects. |
| **UNCERTAIN** | Source code is ambiguous or depends on runtime configurations/third-party APIs not verifiable in static audit. |
| **NOT_APPLICABLE** | Requirement was excluded or irrelevant to the audited scope. |

---

## 3. Finding Confidence Classification

| Level | Definition |
|---|---|
| **HIGH** | Proven by explicit code citations, reproducible execution trace, and refuted all 7 adversarial falsification probes. |
| **MEDIUM** | Structural defect is clear, but runtime framework behavior or environmental configuration could alter manifestation. |
| **LOW** | Theoretical vulnerability or gap requiring live staging environment verification. |
