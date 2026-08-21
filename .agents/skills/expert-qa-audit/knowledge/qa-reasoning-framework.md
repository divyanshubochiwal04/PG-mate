# Knowledge Base: QA Reasoning Framework

## 1. The Core Mental Model: Reality vs Perception
Software quality auditing is not static code reading; it is mental simulation of distributed, asynchronous runtime execution against invariant constraints.

### Key Axioms:
1. **File Presence != Execution Reachability**:
   The fact that a function `cancelSubscription()` exists in a file does not mean the user can cancel subscriptions. It might not be routed, its controller route might be disabled by an erroneous decorator, or its payload parser might drop the argument.
2. **Compile-Time Types != Runtime Values**:
   TypeScript types (`status: 'ACTIVE' | 'INACTIVE'`) are stripped at runtime. An API receiving `{ status: "DELETED" }` will accept it unless strict runtime validation (Zod, class-validator) intercepts and sanitizes the input.
3. **Happy Path != Complete Feature**:
   80% of lines in a system handle failure modes, edge cases, rollbacks, and recovery. If an implementation only handles the 200 OK path, it is only 20% implemented.
4. **Absence in File A != Absence in System**:
   Before claiming "Tenant isolation is missing in the repository", check if the database connection uses Row-Level Security (RLS), an automatic Kysely plugin, or an upstream Tenant middleware context.

---

## 2. The 4 Dimensions of Implementation Verification

For every feature or requirement, audit across all four dimensions:

```
                  ┌────────────────────────┐
                  │ 1. Existence & Shape   │
                  │ (AST, DTOs, Schemas)   │
                  └───────────┬────────────┘
                              │
                  ┌───────────▼────────────┐
                  │ 2. Reachability & Wire │
                  │ (Routes, DI, Handlers) │
                  └───────────┬────────────┘
                              │
                  ┌───────────▼────────────┐
                  │ 3. Semantic Correctness│
                  │ (Logic, State, Maths)  │
                  └───────────┬────────────┘
                              │
                  ┌───────────▼────────────┐
                  │ 4. Boundary Resilience │
                  │ (Timeouts, Races, Roll)│
                  └────────────────────────┘
```

---

## 3. Systematic Tracing Protocol
To trace any feature from intent to storage:
1. **Identify Entry Point**: Exact HTTP endpoint, WebSocket event, CLI argument, or Cron trigger.
2. **Inspect Pre-Execution Gateways**: Middlewares, Auth Guards, Role/Scope Checkers, Throttlers, Validation Pipes.
3. **Analyze Business Handler**: Service method, entity mutations, validation assertions, business rules.
4. **Inspect Transactional Boundary**: Is database mutation wrapped in an atomic unit of work / ACID transaction?
5. **Inspect Persistence Mutation**: Exact SQL query or ORM call. Check constraints, returning clauses, and defaults.
6. **Inspect Side Effects & Notifications**: Events published, queues pushed, webhooks triggered, in-memory caches invalidated.
7. **Trace Error & Rollback Channels**: If step 5 or 6 fails, does step 4 roll back cleanly or leave orphaned records?
