# Protocol 07: Wrong Implementation & Defect Audit

## Phase Goal
Identify functionality that exists and executes, but contains **erroneous logic, broken assumptions, data type mismatches, or inverted invariants**.

---

## 1. Audit Focus Areas
1. **Inverted Conditions**: e.g., `if (user.role !== 'ADMIN') allow();` vs `if (user.role === 'ADMIN') allow();`.
2. **Object vs Primitive Injection**: Passing `{ id: "..." }` into a UUID column parameter instead of `"..."`.
3. **Response Envelope Unwrapping Bugs**: Expecting direct array `response.data` when backend returns `{ success: true, data: { data: [...] } }`.
4. **Off-by-One Arithmetic**: Pagination offsets, date range boundary math (`<` vs `<=`), timestamp comparisons without timezone normalization.
5. **Shallow vs Deep State Mutations**: Mutating shared state in-place, or ignoring nested relations during update.

---

## 2. Required Finding Structure
Every wrong implementation finding must document:
- The exact flawed line(s).
- Why the logic is flawed.
- The concrete failure scenario where it breaks at runtime.

---

## 3. Required Output Artifact
Create a finding record following [`schemas/finding.md`](file:///schemas/finding.md) with category `WRONG_IMPLEMENTATION`.
