# Schema: Finding Record (`finding.md`)

Use this schema for every confirmed or proposed defect, failure scenario, or security/functional gap.

```markdown
# Finding: `FIND-<NUMBER>`

### 1. Header Metadata
- **Finding ID**: `FIND-<NUMBER>`
- **Severity**: `<CRITICAL | HIGH | MEDIUM | LOW | INFORMATIONAL>`
- **Confidence**: `<HIGH | MEDIUM | LOW>`
- **Related Requirements**: `<REQ-XX, REQ-YY>`
- **Category**: `<MISSING_IMPLEMENTATION | WRONG_IMPLEMENTATION | EDGE_CASE | INTEGRATION_MISMATCH | CONCURRENCY_RACE | STATE_CORRUPTION | SECURITY_LEAK>`

### 2. Precise Code Location
- **File Path**: `<relative/path/to/file.ts>`
- **Line Range**: `<StartLine> - <EndLine>`
- **Enclosing Symbol**: `<Function / Method / Class / Interface>`

### 3. Current Code Evidence
```<language>
// Exact unmodified code demonstrating the issue
```

### 4. Detailed Defect Analysis
- **What is Wrong**: `<Clear technical explanation of the flaw>`
- **Why It Violates Invariants**: `<Explanation against domain/security rules>`

### 5. Concrete Failure Scenario
*Step-by-step reproducible scenario explaining how the failure occurs at runtime:*
1. User / Client sends `<Input / Request>`.
2. Execution reaches `<Component A>` which performs `<Action>`.
3. Unexpected condition `<X>` happens (e.g., Network timeout, Concurrent call, Null property).
4. System executes `<Path B>` leading to `<Failure State: Data loss / 500 error / Invariant breach>`.

### 6. Expected vs Actual Behavior
- **Expected Behavior**: `<What the system should have done>`
- **Actual Behavior**: `<What the system currently does>`

### 7. Concrete Impact
- **Blast Radius**: `<Scope of users / records affected>`
- **Business / Operational Risk**: `<Data corruption / Financial loss / Security vulnerability / Crash>`

### 8. Minimal Safe Fix
- **Fix Rationale**: `<Why this minimal change fixes the root cause safely>`
- **Suggested Code Patch**:
```diff
- // lines to remove
+ // lines to add
```

### 9. Automated Regression Test Scenario
- **Test Type**: `<Unit | Integration | E2E>`
- **Test File Target**: `<path/to/test.spec.ts>`
- **Test Logic / Assertion**: `<Pseudo-code or concrete test case reproducing the bug>`
```
