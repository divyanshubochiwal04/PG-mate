# Protocol 08: Contextual Edge Case Audit

## Phase Goal
Identify system behavior under non-standard, extreme, or unexpected conditions directly applicable to the audited feature.

---

## 1. Contextual Edge Case Vectors
Do NOT generate generic hypothetical edge cases. Examine only cases relevant to the specific domain:

- **Null / Undefined / Empty Collections**: Passing empty array `[]` into SQL `IN (...)` clause (which causes SQL syntax error in raw queries).
- **Extreme Strings & Characters**: Unicode emojis, zero-width spaces, special SQL/JSON characters, strings exceeding column length (`varchar(50)`).
- **Date & Time Boundaries**: Leap years, timezone offsets, daylight savings, past dates for future events.
- **Deactivated / Suspended Entities**: Creating records linked to deleted residents, inactive rooms, or revoked users.
- **Network / Remote Timeout**: Third-party API (Expo push, payment gateway, SMS) timing out after 10s.

---

## 2. Required Finding Structure
Every edge case finding must provide a concrete runtime trigger scenario with reproducible steps.

---

## 3. Required Output Artifact
Create finding records following [`schemas/finding.md`](file:///schemas/finding.md) with category `EDGE_CASE`.
