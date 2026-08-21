# Protocol 09: Contract & Integration Boundary Audit

## Phase Goal
Verify that distinct modules, services, frontends, backends, and external APIs seamlessly interoperate across their interfaces without contract mismatches.

---

## 1. Key Integration Checkpoints

1. **Frontend-Backend Contract Symmetry**:
   - Do API query parameters match the backend's expected `@Query()` DTO keys?
   - Do payload field names match (camelCase vs snake_case)?
   - Are response envelope formats unwrapped synchronously?
2. **DTO & Database Column Symmetry**:
   - Does the DTO allow fields that the database rejects?
   - Does the database require columns (`NOT NULL`) that the DTO omits?
3. **Event Emitter & Listener Symmetry**:
   - Does every emitted event have an active registered listener?
   - Do event payload types match on publisher and subscriber sides?
4. **Third-Party External API Contracts**:
   - Are external API keys, base URLs, and timeout headers configured correctly in all environments?

---

## 2. Required Output Artifact
Create finding records following [`schemas/finding.md`](file:///schemas/finding.md) with category `INTEGRATION_MISMATCH`.
