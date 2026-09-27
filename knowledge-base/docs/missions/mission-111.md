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

## Mission Exit Gate

all controls implemented or explicitly verified as already satisfied; targeted tests GREEN; relevant regression GREEN; build GREEN; security/tenant/RBAC implications verified; migration/API contract verified where applicable; documentation/evidence captured.
