# Protocol 04: Execution Flow Tracing

## Phase Goal
Trace the complete runtime execution path for each audited feature across all layers from input trigger to persistent storage and outbound side effects.

---

## 1. Trace Hierarchy
For each flow, verify the unbroken chain of custody:

```
[Trigger / Request]
      ↓
[Authentication & Authorization Guard]
      ↓
[Validation & Transformation Pipe]
      ↓
[Controller / Route Handler]
      ↓
[Service Layer & Domain Invariants]
      ↓
[Transaction Boundary (ACID)]
      ↓
[Repository Query / Database Mutation]
      ↓
[Outbound Events / Queues / Push]
      ↓
[Response Envelope Serialization]
```

---

## 2. Verification Checks in Flow
- **Parameter Hand-off**: Are arguments properly forwarded from controller to service, or are parameters dropped/renamed?
- **Decorator Return Types**: Do custom decorators (`@CurrentUser`, `@CurrentOrganization`) pass clean scalar primitives (UUID strings) or full objects that could crash query builders?
- **Async Execution**: Are all asynchronous operations (`Promise`, `db.execute()`, `fetch()`) properly awaited? Are unhandled floating promises present?
- **Response Wrapper Formatting**: Does the backend wrap responses (e.g. `{ success: true, data: T }`) and does the consumer unwrap `response.data.data` correctly?

---

## 3. Required Output Artifact
Populate dynamic execution context in evidence records conforming to [`schemas/evidence-record.md`](file:///schemas/evidence-record.md).

Transition to: `[FLOWS_TRACED]`.
