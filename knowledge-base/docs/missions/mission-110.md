---
title: "Mission 110 - BILLING PLATFORM"
slug: /missions/110/
sidebar_position: 110
---

# Mission 110 - BILLING PLATFORM

> Authoritative scope imported from the TITAN Master Mission Control Register.

## Objective

Implement commercial billing.

## Delivery Classification

- **Frontend classification:** FRONTEND-VISIBLE
Local frontend expectation: visible change is expected only where the listed mission controls require a user-facing workflow, page, visualisation or verification surface.

## Controls

### Control 110.1 - Billing accounts

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Status:** AUTHENTICATED API VERIFIED LOCALLY / STAGING API DEPLOYED / LIVE AUTHENTICATED CHECK PENDING

**Evidence (27 September 2026):** A tenant-scoped, one-per-user billing identity is introduced through `BillingAccount` with a composite foreign key to the existing user. An internal service checks the active user in the supplied tenant and idempotently ensures the account. Its caller must supply tenant and user IDs from the authenticated server context; no public billing route is wired yet. The migration creates no historical accounts and changes no existing payments, invoices, or entitlements. Focused integration coverage checks tenant isolation, inactive users, uniqueness, and absence of payment or entitlement side effects. Prisma schema validation, client generation, backend build, and focused lint passed locally. The migration and focused integration test passed on titan_core_test; adjacent payment and entitlement regression passed (18 tests). Staging migration applied with titan_migrator from the 28d958b release bundle; backend recreated and /health returned HTTP 200 on 27 September 2026. An authenticated PUT /api/v1/auth/me/billing-account now derives identity from the access token and creates the account idempotently; API and service integration tests passed (2 tests), with no payment or entitlement side effects. API release 4963627 was deployed to staging on 27 September 2026; /health returned HTTP 200 and anonymous PUT /api/v1/auth/me/billing-account returned HTTP 401. A live authenticated account creation and payment checkout remain pending.

### Control 110.2 - Invoices/charges

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.
**Status:** IMPLEMENTED / LOCALLY VERIFIED / TEST MIGRATION APPLIED / STAGING DEPLOYMENT PENDING / LIVE EMAIL VERIFICATION PENDING

**Evidence (27 September 2026):** Control 110.2 introduces a tenant-scoped `BillingInvoice` linked one-to-one to a confirmed `Payment`, with database-enforced tenant, user and product ownership. A tenant/year `BillingInvoiceCounter` allocates sequential numbers in the form `TITAN-YYYY-000001`. Repeating invoice issuance for the same payment returns the existing invoice and does not allocate another invoice or number.

The invoice snapshots the confirmed payment amount, currency, billing interval, recipient, product and provider reference. No VAT or tax fields or calculations are present; the invoice amount equals the confirmed payment amount.

A premium TITAN-branded PDF is generated using `pdf-lib`, persisted with a SHA-256 integrity digest, and associated with durable delivery state (`PENDING`, `SENDING`, `SENT`, `FAILED`). Delivery audit data includes attempt count, provider, provider message ID, timestamps and the latest error.

The email boundary sends the invoice to the customer with `accounts@titan-tech.co.za` as BCC, includes readable text and branded HTML, attaches the PDF, and uses deterministic invoice-based provider idempotency. Automated tests use fake delivery; no real email was sent.

Migration `20260927122000_add_payment_invoices` was applied only to `titan_core_test`. Prisma reported 77 migrations and the test database schema up to date. Invoice issuance tests passed 5/5. Invoice issuance, delivery and Resend-adapter coverage passed 3 files/10 tests. Adjacent billing/payment regression passed 6 files/24 tests. Prisma validation, TypeScript build, focused lint and `git diff --check` passed. Confirmed-payment gating, pending/failed rejection, tenant isolation, PDF integrity, sequential numbering, same-payment idempotency and delivery retry behaviour were verified locally.

Production dependency findings were reduced from 6 to 4 by safely updating `qs` to 6.16.0 and `fast-uri` to 3.1.8. The remaining four high findings are in the existing Prisma 7.9.1 dependency chain (`prisma`, `@prisma/config`, `deepmerge-ts`, `mysql2`) and remain tracked separately. No forced Prisma downgrade or unsafe dependency override was introduced.

No 110.2 staging migration or backend deployment has yet been performed. No real invoice email has been sent and no live invoice/payment workflow has been verified. Runtime sender/domain configuration and verified issuer details must be confirmed before real invoice delivery is enabled. Control 110.2 is therefore not yet classified as released or live-verified.

### Control 110.3 - Payment state

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 110.4 - Subscription linkage

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 110.5 - Entitlement linkage

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 110.6 - Payment failures

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 110.7 - Reconciliation

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 110.8 - Secure payment integration boundary

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

## Mission Exit Gate

all controls implemented or explicitly verified as already satisfied; targeted tests GREEN; relevant regression GREEN; build GREEN; security/tenant/RBAC implications verified; migration/API contract verified where applicable; documentation/evidence captured.
