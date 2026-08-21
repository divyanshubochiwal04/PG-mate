# Schema: Evidence Record (`evidence-record.md`)

Use this schema whenever recording concrete code-level proof during functional, flow, or integration audits.

```markdown
# Evidence Record

### 1. Evidence Identifier: `EV-<NUMBER>`
- **Associated REQ-ID**: `<REQ-XX>`
- **Phase Recorded**: `<Phase Name / Number>`
- **Verdict Type**: `<SUPPORTS_COMPLIANCE | SUPPORTS_DEFECT | INCONCLUSIVE>`

### 2. Location
- **Repository / Package**: `<package name>`
- **File Path**: `<relative/path/to/file.ts>`
- **Line Range**: `<StartLine> - <EndLine>`
- **Code Symbol / AST Node**: `<e.g., TaskService.createTask, JwtAuthGuard.canActivate>`

### 3. Code Excerpt
```<language>
// Exact snippet from source code
<code lines>
```

### 4. Dynamic Execution Context
- **Invocation Trigger**: `<e.g., HTTP POST /tasks -> TaskController.createTask>`
- **Caller Context**: `<e.g., Called by TaskController after JwtAuthGuard passed>`
- **Downstream Callbacks / Queries**: `<e.g., TaskRepository.create via db.insertInto>`

### 5. Analytical Assessment
- **Observed Behavior**: `<Detailed description of what the code actually does at runtime>`
- **Boundary Conditions Handled**: `<What errors / edge cases are caught>`
- **Boundary Conditions Missed**: `<What conditions slip through unhandled>`
```
