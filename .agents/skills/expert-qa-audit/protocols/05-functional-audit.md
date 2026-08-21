# Protocol 05: Functional Core Audit

## Phase Goal
Audit each atomic requirement (`REQ-*`) individually against observable source code to verify happy-path and normal-path functional correctness.

---

## 1. Audit Checkpoints for Each Requirement

1. **Existence**: Does real code implementing the requirement exist?
2. **Reachability**: Is the code reachable through active routes/handlers?
3. **Correctness**: Does the business logic correctly implement the specification?
4. **Input Handling**: Are valid inputs accepted and processed according to rules?
5. **Output Delivery**: Does the output match the expected contract and data types?

---

## 2. Status Assignment Rules
- Assign `VERIFIED` only if exact code lines prove full functionality.
- Assign `PARTIALLY_VERIFIED` if happy path works but core validation is incomplete.
- Assign `FAILED` if logic is wrong or produces erroneous results.
- Assign `UNCERTAIN` if code cannot be verified with certainty.

---

## 3. Required Output Artifact
Update `requirement-ledger.md` with status and exact file/line citations for every audited requirement.
