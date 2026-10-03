# FRL Project Skill

## Core Rules

### 1. No Single Score
Never create, calculate, store, or display an overall score,
total rating, final grade, or combined score.

Keep all FRL axes separate:
- Reliability
- Stability
- Resilience
- Leverage
- Track Record
- Data Confidence

### 2. Selective Disclosure
Verification Links expose only Claim information.

Counterparties may see:
- True / False
- Evidence Tier

Never expose RawDataPoint or raw financial data through
the verification API or UI.

### 3. Insufficient Data ≠ Bad
Use `insufficient_data` when evidence is not sufficient.

Never convert insufficient data into:
- 0%
- a low score
- "bad"
- "high risk"
- any equivalent judgment

## Before Changing Code

Inspect the existing implementation and follow the FRL specification
before adding or modifying features.
