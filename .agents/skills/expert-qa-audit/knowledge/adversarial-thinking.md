# Knowledge Base: Adversarial Thinking & Red-Teaming Patterns

## 1. The Falsification Principle
The primary bias of an AI reviewer is **confirmation bias** — finding a line that looks suspicious and instantly reporting it as a bug without investigating protective layers elsewhere.

The Adversarial Reviewer operates in reverse:
> **"Assume the code author was smart and protective layers exist elsewhere. My goal is to actively search the entire repository to disprove my own suspected bug. Only if every defense fails do I confirm the finding."**

---

## 2. The 7 Adversarial Defense Probes

Whenever you suspect a bug, you must execute these 7 adversarial probes before concluding it is a defect:

### Probe 1: Database Invariant Defense
* *Question*: Does PostgreSQL / MySQL schema already enforce this rule via `NOT NULL`, `CHECK`, `UNIQUE (tenant_id, code)`, or `FOREIGN KEY ... ON DELETE RESTRICT`?
* *Action*: Check table migrations and schema definitions.

### Probe 2: Upstream Interceptor & Pipe Defense
* *Question*: Is this payload already validated before the controller runs via a global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` or Zod Middleware?
* *Action*: Inspect `main.ts`, global pipes, and module-level guards.

### Probe 3: Storage & Repository Layer Defense
* *Question*: Does the base repository or unit-of-work auto-inject `organization_id` on every query?
* *Action*: Inspect the repository base class and query builder plugins.

### Probe 4: Type-Level Compilation Defense
* *Question*: Does the TypeScript compiler or schema generator guarantee that this state is unreachable?
* *Action*: Check discriminating unions, exhaustiveness checks (`never`), and strict null checks.

### Probe 5: Production Reachability Defense
* *Question*: Is this route or function exported, mounted, and reachable in production runtime? Or is it dead code / test utility?
* *Action*: Trace imports and route table declarations.

### Probe 6: Specification Alignment Defense
* *Question*: Is this behavior an explicit requirement, or is the reviewer imposing an arbitrary opinion?
* *Action*: Re-read user requirements. Do not convert missing optional features into critical defects.

### Probe 7: Non-Functional vs Functional Bug Defense
* *Question*: Does this cause runtime data corruption, security breach, or application crash? Or is it merely code style?
* *Action*: Reject style preferences; keep only functional and security defects.
