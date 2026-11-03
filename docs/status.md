# Implementation and feature status

Last verified: 2026-11-03 (95 unit/integration tests, 3 Playwright e2e tests, `tsc`, `eslint`, `next build` all green).

This file separates what is **built and tested** from what is **not built**. Nothing here claims regulatory certification or a live government integration.

## 1. Implemented and tested

| Area | What exists | Evidence |
|---|---|---|
| Tenant isolation | Every document carries `orgId`; all module data access goes through `tenantCol()`; a lint rule bans raw db access in modules/app/ui | `core/db/tenant.test.ts`, per-module org-isolation tests |
| Auth | Better Auth email+password, server-side sessions, optional TOTP MFA (login challenge + enrolment page) | e2e login, manual MFA path untested end to end |
| RBAC | 18 roles, `resource:action` permissions, server-side `assertPermission` in every service function and page gate | `rbac/authorize.test.ts`, e2e access test |
| Audit | Append-only audit rows written in the same transaction as the change; no update/delete API; every clinical read audited | `audit.test.ts`, emr/patients tests |
| Outbox | Transactional events, atomic claim, retry with backoff, dead-letter | `audit.test.ts` |
| Patients | Atomic MRN (20 parallel creates → 20 sequential), Emirates ID encrypted (AES-256-GCM) + blind index, masked on read, duplicate hints, Arabic search | `patients/service.test.ts` |
| Appointments | Race-free booking (10 parallel → 1 winner; partial overlaps too), working hours, leave/holidays, state machine, reschedule, drag-and-drop UI | `appointments/service.test.ts`, e2e |
| Queue | Daily per-branch tokens, priority, wait estimate from real consult durations, org-scoped SSE, public display with no patient fields | `queue/service.test.ts` |
| EMR | Encounter workspace, vitals, diagnoses (ICD code entry), SOAP notes, sign / amend with versioning (v1 preserved), allergy alerts, audited reads | `emr/service.test.ts`, e2e |
| Charges | Price and tax snapshot, idempotent consultation charge on encounter completion | `billing/charges.test.ts` |
| Ledger | Balanced double-entry journal, idempotency keys (also under parallel retries), period locks, reversals, trial balance; posted entries are never updated | `ledger/journal.test.ts` |
| Billing | Invoices with per-line VAT, payments (split, advance on overpayment), refunds, credit notes, receipts | `billing/invoice.test.ts`, e2e |
| Reconciliation | Random invoice/payment/refund/credit-note sequences: AR sub-ledger equals GL balance, trial balance balances | `ledger/reconcile.test.ts` |
| Reports | P&L, revenue by doctor/department (reconciles to P&L), AR aging, executive/reception/doctor/accounts dashboards with previous-period comparison, zero-safe | `reports/reports.test.ts` |
| Shell | Collapsible sidebar, role-filtered nav, command palette (Ctrl+K), breadcrumbs, dark mode, EN/AR with RTL, mobile nav | e2e (RTL) |

## 2. Implemented but not externally validated

- VAT: invoices apply a configured rate (default **5% standard-rated with a "review required" flag on every service**). No service is assumed zero-rated. A UAE tax professional must classify each service before real use.
- Encryption key handling: a single env key; no KMS, no rotation tooling.
- SSE uses an in-process bus: correct for one server instance only. A multi-instance deployment needs a shared transport (Mongo change streams or Redis pub/sub).
- Queue wait estimate is a simple average of recent consults; it has not been tuned on real data.

## 3. Not built yet (scoped out of phases 0–4; the original brief is far larger)

Insurance (eligibility, pre-auth, claims, remittance), pharmacy and prescriptions, laboratory and radiology, inventory/procurement/accounts payable, HR and payroll, CRM campaigns and surveys, specialty modules (dental chart, physio, derm, paeds), patient portal and kiosk, communications centre (email/SMS/WhatsApp), AI assistants, hospital modules (inpatient, ER, theatre), bank reconciliation and statement import, cash registers, UAE e-invoicing (structured), financial statements beyond P&L (balance sheet, cash flow), multi-branch consolidated reporting, saved views and configurable widgets, notification centre, FullCalendar-style month/week/resource views.

Sandbox adapters for DHA eClaimLink, Shafafiya, Riayati, NABIDH and Malaffi are **not** present. See `integration-readiness.md`.

## 4. Awaiting credentials, licences or regulator approval

Everything in `integration-readiness.md` beyond "Not configured": coding catalogues (CPT is licensed), regulator specifications and onboarding, HIE credentials, e-invoicing Accredited Service Provider, SMS/WhatsApp gateways, drug-knowledge provider.

## 5. Requires clinical or regulatory review before real use

Triage rules (none implemented), reference ranges (none implemented), drug-interaction checking (none implemented, deliberately), tax classification, retention periods, consent wording in the registration form, break-glass policy (not implemented).

## 6. Known limitations in what exists

- The reference dashboard (shadcnuikit.com hospital-management) was **not** inspected; the UI is an original design built from the brief. `docs/design/reference-notes.md` says so.
- UI kit is hand-built Tailwind, not shadcn/Radix; charts are CSS bars; the scheduler is a custom day grid. Accessibility has had keyboard/label care but no audit.
- Dashboards fetch appointment rows into memory for the selected range (capped at 100k): fine for a clinic, needs aggregation pipelines at scale.
- Database is MongoDB (agreed in the design spec), not the PostgreSQL/Prisma named in the original brief.
- Tests run on an in-memory MongoDB replica set. Nothing has been run against Atlas yet because no connection string was available in this workspace.
