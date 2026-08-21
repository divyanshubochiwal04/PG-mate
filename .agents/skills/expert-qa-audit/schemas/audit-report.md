# Schema: Final Audit Report (`audit-report.md`)

Use this schema for Phase 14 (Final Reconciliation & Audit Report Delivery).

```markdown
# Comprehensive Implementation QA Audit Report

## 1. Executive Summary & Verdict
- **Target Feature / Scope**: `<Feature Name>`
- **Audit Date**: `<ISO Date>`
- **Overall Final Verdict**: `<VERIFIED_COMPLETE | FUNCTIONALLY_COMPLETE_WITH_RISKS | PARTIALLY_IMPLEMENTED | NOT_SAFE_TO_DECLARE_COMPLETE | INSUFFICIENT_EVIDENCE>`
- **Verdict Summary**: `<2-3 concise paragraphs summarizing the real state of the implementation>`

---

## 2. Requirement Coverage & Reconciliation Matrix

| REQ-ID | Atomic Requirement | Category | Status | Code Evidence Citations | Findings |
|---|---|---|---|---|---|
| REQ-01 | ... | ... | VERIFIED | `file:line-range` | None |
| REQ-02 | ... | ... | FAILED | `file:line-range` | FIND-01 |

- **Total Requirements Audited**: `<Count>`
- **Verified Complete**: `<Count>`
- **Partially Implemented**: `<Count>`
- **Failed / Defective**: `<Count>`
- **Uncertain / Inconclusive**: `<Count>`

---

## 3. Confirmed Critical & High Findings
*(Ordered strictly by severity: CRITICAL -> HIGH -> MEDIUM -> LOW)*

### [FIND-01] <Title> (Severity: CRITICAL | Confidence: HIGH)
- **Location**: [`file/path.ts:L10-L30`](file:///path/to/file.ts#L10-L30)
- **Issue Summary**: <Summary>
- **Failure Scenario**: <Step-by-step trigger>
- **Impact**: <Impact>
- **Minimal Safe Fix**:
```diff
+ // patch
```
- **Automated Regression Test**: <Test recommendation>

---

## 4. Medium & Low Risk Findings
*(Follow same structured format for remaining findings)*

---

## 5. Partial & Unverified Requirements
*(List any requirements that could not be fully verified, along with concrete explanation of missing proof)*

---

## 6. Rejected Findings & Non-Issues
*(Briefly document any potential concerns that were challenged and disproven during Phase 12)*
- **Refuted Finding A**: Explaining why existing DB constraint / guard makes this safe.

---

## 7. Recommended Action Plan & Minimal Fix Set
1. Step 1: Apply minimal patch for `FIND-01`
2. Step 2: Apply minimal patch for `FIND-02`
3. Step 3: Run recommended regression test suite

---

## 8. Final Confidence Sign-off
- **Audit Rigor Score**: `<100% Code Verified | Partial Scope>`
- **Principal QA Signature**: `Antigravity Expert QA Engine`
```
