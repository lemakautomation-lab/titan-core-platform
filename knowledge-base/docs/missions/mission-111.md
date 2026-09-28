---
title: "Mission 111 - ORGANISATION ONBOARDING"
slug: /missions/111/
sidebar_position: 111
---

# Mission 111 - ORGANISATION ONBOARDING

> Authoritative scope imported from the TITAN Master Mission Control Register.

## Objective

Build enterprise onboarding.

## Delivery Classification

- **Frontend classification:** FRONTEND-VISIBLE
Local frontend expectation: visible change is expected only where the listed mission controls require a user-facing workflow, page, visualisation or verification surface.

## Controls

### Control 111.1 - Organisation registration

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Progress (27 September 2026):** Organisation slugs are now unique within each tenant, with a database migration and tenant-isolation regression test. This foundation passed Prisma validation, client generation, backend build and focused test. Registration remains pending: the existing tenant creation path activates immediately, and current product prices require an existing tenant. The onboarding flow must hold access inactive until verified payment and provision the tenant and initial administrator safely.

### Control 111.2 - Plan selection

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 111.3 - Payment

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 111.4 - Organisation setup

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 111.5 - Initial administrator

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 111.6 - Tenant provisioning

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 111.7 - Onboarding validation

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 111.8 - Access activation only after required payment

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

## Implementation Evidence (27 September 2026)

Tenant-scoped organisation slugs, an inactive-tenant JWT access gate, and an internal pending-registration boundary are implemented locally. Registration snapshots an active monthly or annual plan and creates no tenant or administrator. The schema migrations were applied to titan_core_test only. Prisma validation, client generation, backend build, and focused regression passed; adjacent organisation tests passed 6/6 and registration/access tests passed 4/4. Public signup, email ownership verification, provider checkout, verified organisation payment fulfillment, administrator setup, remain pending. Existing athlete/trainer entitlement fulfillment cannot activate an organisation application.
**Regression verification (27 September 2026):** Full backend serial regression passed 237/237 files and 1425/1425 tests. Four provisioning tests initially reached the default five-second timeout under full-suite load; the provisioning tests now have explicit 30-second timeouts and the full suite passed. Mission 111 remains open pending public onboarding, verified payment activation, and staging verification.

**Staging verification (27 September 2026):** Release df8d8407c2eb397e75f1a8fe4d10a152c1d13c5b was built from the committed archive. A staging database backup was taken, both Mission 111 migrations applied successfully, the backend was recreated, and its health check passed. Live signup and paid activation remain pending.

## Current Delivery Evidence (28 September 2026)

**Status: ACTIVE.** The provider-neutral registration, plan selection, email verification, verified-payment event boundary, atomic provisioning, initial administrator setup, tenant-scoped starter permissions, and public onboarding frontend have been implemented and pushed. Staging confirms registration through `PENDING_PAYMENT`. No hosted checkout or real payment verification is connected; paid activation has not been verified. Do not classify Mission 111 as complete or production released.

### Implementation and regression

- Verified organisation payment event boundary: `4519ab6797796727a3a3c583242d31086ebcf19e`. Duplicate concurrent event handling and exactly four controlled paths were verified.
- Atomic organisation, initial administrator and inactive tenant provisioning: `8a9d0bc1c0cdba8aea2aac746a8c8d0438a16330`. The tenant remains inactive pending final validation and activation.
- Email ownership verification: `98ac21b685cff743d692d3415fbb1ecdd96a25de`.
- Administrator setup and activation boundary: `e846c40716de3f4c937d0028fa246497aec9140b`.
- Tenant-scoped starter administrator permission grants: `763d8e5d3e160641bad3f116d6047dee62c63da6`. Backend full regression passed **242/242 files and 1443/1443 tests**; build and diff checks passed.
- Provider-neutral frontend: `da20534423493a33d4d171c4578ec151c07a58c2`. Registration, email verification, setup request and administrator setup pages were added. Focused frontend tests passed **41/41**; full frontend regression passed **45/45 files and 267/267 tests**; production frontend build passed. The payment page explicitly shows a pending checkout and does not claim access.
- Staging transactional email Compose mapping: `d096e7abd1b8cb898543babc27f8a7e2e0d09f4e`. Resend sending domain `notify.titan-tech.co.za` was verified. The API key is held only in the staging secrets file and is not in Git or this record.
- Introductory staging plans are defined in `infrastructure/staging/seed-organisation-onboarding-plans.sql`: **ZAR 399.00 monthly** and **ZAR 3,990.00 annually** (about 17% below twelve monthly payments). The public plans API returned `39900` and `399000` minor units with the matching billing intervals. No VAT is added per the current TitanTech billing instruction; tax treatment must be rechecked before production invoicing.

### Staging evidence

The committed frontend and backend archive for `da20534423493a33d4d171c4578ec151c07a58c2` was verified by SHA-256 `22953732085f2ff50acb81ca7b2f561f96697f2882f7a69eba37c8dbd8d8060f` before extraction. A pre-migration PostgreSQL backup was taken (`ae843bdfb37491c8be8471f26027b0dc3568bd258196a879e8dc945d74cb87e3`). Prisma reported all migrations successfully applied; backend and web images built from that archive and were recreated. `/api/v1/health` returned HTTP 200 with database connected. The subsequent email configuration commit was validated with Compose and the backend was recreated; health returned HTTP 200 again.

A staging organisation registration using the monthly plan showed “Check your email” and supplied an application ID. The verification email arrived at a controlled TitanTech inbox; opening its link and confirming in the frontend displayed that the application is awaiting payment and access is inactive. No card was charged, no payment-confirmed event was triggered, and no tenant activation was claimed. The plan seed is a staging operation, not a production price publication.

### Remaining Mission 111 exit work

1. Choose a payment provider that supports the required EFT, Visa/Amex, Apple Pay and Google Pay mix in the applicable markets. Peach Payments paused early-stage merchant onboarding; provider selection remains open. Do not install the earlier Paystack adapter draft merely because it exists.
2. Implement hosted checkout and server-side provider verification. Only a verified, amount/currency/plan-matched payment event may enter the existing fulfillment and provisioning boundary; preserve idempotency and failure isolation.
3. Verify payment, provisioning, administrator setup and tenant activation end to end in staging, including duplicate callbacks, failed or cancelled payments, and cross-tenant denial. Confirm invoice generation and delivery under the separate billing controls before production billing.
4. Re-run relevant regression, build, migration and security gates; capture release and Knowledge Base publication evidence. Close controls 111.3 and 111.8, then close Mission 111 only after the exit gate is met.

Earlier progress paragraphs above are historical snapshots and are superseded by this current status.

## Mission Exit Gate

all controls implemented or explicitly verified as already satisfied; targeted tests GREEN; relevant regression GREEN; build GREEN; security/tenant/RBAC implications verified; migration/API contract verified where applicable; documentation/evidence captured.
