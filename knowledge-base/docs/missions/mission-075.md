---
title: "Mission 075 - AI TRAINER ASSISTANT"
slug: /missions/075/
sidebar_position: 75
---

# Mission 075 - AI TRAINER ASSISTANT

> Authoritative scope imported from the TITAN Master Mission Control Register.

## Objective

Provide AI assistance for professional trainers.

## Delivery Classification

- **Frontend classification:** FRONTEND-VISIBLE

Mission 075 provides an authenticated Trainer AI decision-support workflow while retaining TITAN tenant, relationship, permission, privacy, explainability and audit boundaries.

## Controls

### Control 75.1 - Trainer-authorised portfolio context

**Status:** COMPLETE / VERIFIED / PUBLICATION PENDING (1 October 2026).

Authenticated `GET /api/v1/ai-trainer-assistant/context` derives portfolio scope exclusively from the signed-in Trainer account and tenant. It requires authentication and `workout-programmes.read`, reuses the active Trainer commercial-access boundary and returns only active authorised Trainer-client relationships.

Client, tenant, user, prompt or other scope overrides cannot be supplied. Query parameters are rejected and responses are marked `Cache-Control: no-store`.

**Staging verification:** Authenticated live portfolio retrieval passed. The returned portfolio was restricted to the staging Trainer's authorised clients and an attempted scope override was rejected.

### Control 75.2 - Client adherence queries

**Status:** COMPLETE / VERIFIED / PUBLICATION PENDING (1 October 2026).

The `ADHERENCE` task derives bounded facts from the previous 28 days of Trainer session scheduling data. It reports total past sessions, completed sessions, cancelled sessions, unresolved scheduled sessions and completion percentage.

Session completion is explicitly defined as Trainer schedule workflow status and is not treated as proof that every exercise was performed.

No session title, notes or arbitrary free text are included in the AI projection.

**Staging verification:** Live authenticated `ADHERENCE` generation returned `GENERATED`; explanation, limitations and privacy checks passed.

### Control 75.3 - Performance trend queries

**Status:** COMPLETE / VERIFIED / PUBLICATION PENDING (1 October 2026).

The `PERFORMANCE_TRENDS` task uses a bounded maximum of 12 performance metric snapshots. Only safe metric slugs, safe units, latest value, previous value, numeric delta, measurement count and direction are exposed.

Direction is restricted to `UP`, `DOWN`, `UNCHANGED` or `INSUFFICIENT_DATA`. TITAN does not infer that numeric movement represents improvement or decline because authoritative metric semantics may differ.

**Staging verification:** Live authenticated `PERFORMANCE_TRENDS` generation returned `GENERATED`; explanation, limitations and privacy checks passed.

### Control 75.4 - Programme proposal support

**Status:** COMPLETE / VERIFIED / PUBLICATION PENDING (1 October 2026).

The `PROGRAMME_PROPOSAL` task provides conservative decision support for Trainer review. Programme facts are restricted to a maximum of five active programmes and expose only training frequency, session duration and status.

Programme names, descriptions, goals and free-text content are excluded from the provider projection. The provider cannot autonomously modify a programme and is instructed not to diagnose, treat, assess exercise safety, prescribe medication or supplements, or provide medical advice.

**Staging verification:** Live authenticated `PROGRAMME_PROPOSAL` generation returned `GENERATED`; explanation, limitations and privacy checks passed.

### Control 75.5 - Progress report generation

**Status:** COMPLETE / VERIFIED / PUBLICATION PENDING (1 October 2026).

The `PROGRESS_REPORT` task produces a bounded professional summary from the same authorised factual projection used by Mission 075.

Provider output is strictly validated and restricted to:

- one professional summary;
- one to five factual observations;
- one to five Trainer-review considerations.

Plain-text length and character restrictions are applied. Invalid or malformed provider output fails closed.

**Staging verification:** Live authenticated `PROGRESS_REPORT` generation returned `GENERATED`; explanation, limitations and privacy checks passed.

### Control 75.6 - Authorisation enforcement

**Status:** COMPLETE / VERIFIED / PUBLICATION PENDING (1 October 2026).

Mission 075 enforces multiple independent access boundaries:

- authenticated TITAN session;
- active tenant;
- `workout-programmes.read`;
- active Trainer user type and commercial entitlement or controlled staging test grant;
- active Trainer-client relationship;
- tenant-scoped Athlete and Trainer data access;
- exact bounded request shape;
- explicit per-request data-transfer acknowledgement.

The generation route accepts exactly `acknowledgement`, `athleteId` and `queryType`. Arbitrary prompts and scope overrides are rejected.

Generation is limited to three requests per authenticated tenant/user per minute.

**Staging verification:** Active Trainer-client relationship enforcement passed. Cross-tenant isolation passed. Portfolio scope override rejection passed. The live smoke respected the three-request rate window before executing the fourth AI task.

### Control 75.7 - Explainability

**Status:** COMPLETE / VERIFIED / PUBLICATION PENDING (1 October 2026).

Generated and insufficient-data responses include a server-generated explanation envelope rather than model-generated reasoning.

The explanation records:

- version;
- retrieval timestamp;
- the exact bounded adherence facts;
- the exact bounded performance trend facts;
- the exact bounded programme facts;
- source availability states.

Fixed server-generated limitations state that session completion is a workflow state, numeric movement is not automatically improvement or decline, programme information is bounded, AI output may be incomplete or incorrect, Trainer review remains required, and the assistant does not provide diagnosis, treatment, exercise-safety assessment or medical advice.

Confidence is explicitly `NOT_ASSESSED`.

**Staging verification:** Explanation and limitations verification passed for all four live generated Trainer AI task types.

### Control 75.8 - AI auditability

**Status:** COMPLETE / VERIFIED / PUBLICATION PENDING (1 October 2026).

Mission 075 uses the existing TITAN audit infrastructure. No new audit table or Prisma migration was introduced.

Audit identity:

- action: `AI_TRAINER_ASSISTANCE`;
- resource: `AI_TRAINER_ASSISTANT`;
- resource ID: authorised Athlete ID.

Audit metadata is versioned and explicitly allowlisted. It records only:

- schema version;
- policy version;
- explicit transfer acknowledgement;
- request correlation identifier;
- query type;
- outcome;
- bounded source-coverage booleans;
- provider identity;
- configured model identity;
- whether the provider was invoked.

Raw prompts, session titles, session notes, model output, report payloads, API keys, authentication tokens and provider response bodies are not stored in Mission 075 AI audit metadata.

Audited outcomes include:

- `GENERATED`;
- `INSUFFICIENT_DATA`;
- `ACCESS_DENIED`;
- `ATHLETE_NOT_FOUND`;
- `DATA_FAILURE`;
- `PROVIDER_FAILURE`;
- `INVALID_OUTPUT`.

Required audit persistence is awaited and therefore fail-closed before successful assistance is returned.

**Staging verification:** Four generated AI audit events were verified. Two denied-boundary audit events were verified. Correlation, metadata allowlist and privacy checks passed. Synthetic business records were removed after smoke verification while AI audit evidence was retained for traceability.

## Provider Boundary

Mission 075 uses the server-side OpenAI Responses API.

Controls include:

- `TRAINER_AI_ENABLED=true` required;
- server-held `OPENAI_API_KEY`;
- configured `OPENAI_MODEL`;
- `store: false`;
- no provider tools;
- strict JSON schema output;
- maximum 900 output tokens;
- 20-second timeout;
- no client-supplied prompt;
- bounded TITAN facts only;
- validated output before use;
- safe 503 failure response when unavailable.

`store: false` is not treated as proof of zero provider-side retention.

## Engineering Verification Evidence

### Implementation

Mission 075 controls 75.1 through 75.8 were delivered as one controlled implementation batch.

Implementation commit:

`eb94b9141943a94dca4063b5ff0824fc29829295`

Subject:

`Mission 075: Add AI trainer assistant`

The implementation commit contained exactly 15 controlled Mission 075 files.

A subsequent controlled staging configuration commit added `TRAINER_AI_ENABLED` to the staging backend environment:

`2a85f0d9bbcb2f46d16da17ae5c6d784c630a732`

Subject:

`Mission 075: Enable trainer AI staging configuration`

### Automated verification

Full backend regression:

- 268 test files passed;
- 1553 tests passed.

Backend TypeScript production build passed.

Backend lint completed with:

- zero errors;
- 31 warnings from existing repository lint debt.

Full frontend regression:

- 47 test files passed;
- 273 tests passed.

Frontend production build passed.

Frontend Biome lint:

- 130 files checked;
- zero lint errors.

`git diff --check` passed.

Protected untracked governance files remained untouched throughout implementation and release verification.

No Mission 075 Prisma schema change, database migration, package addition or dependency change was required.

### Staging deployment

Staging was fast-forwarded to:

`2a85f0d9bbcb2f46d16da17ae5c6d784c630a732`

Backend and frontend staging images rebuilt successfully.

Runtime verification confirmed:

- `NODE_ENV=staging`;
- Trainer AI enabled;
- OpenAI credential present without exposing its value;
- synthetic Trainer staging grant configuration present;
- backend database connectivity healthy.

External staging health returned HTTP 200 with:

- service `titan-core-backend`;
- status `ok`;
- database `connected`.

### Authenticated live AI smoke

Authenticated staging smoke verified:

- Trainer portfolio context;
- scope-override rejection;
- `ADHERENCE` generated;
- `PERFORMANCE_TRENDS` generated;
- `PROGRAMME_PROPOSAL` generated;
- `PROGRESS_REPORT` generated;
- explanation present and valid for every task;
- limitations present and valid for every task;
- privacy checks for every task;
- active Trainer-client relationship enforcement;
- cross-tenant isolation;
- four generated AI audit events;
- two denied-boundary audit events;
- audit metadata allowlist;
- request correlation;
- privacy-safe audit persistence;
- controlled synthetic-data cleanup;
- final repository state;
- external health after verification.

The live staging gate ended:

`MISSION 075 LIVE STAGING VERIFICATION GREEN`

## Mission Exit Gate

**Status:** IMPLEMENTATION AND STAGING VERIFIED / KNOWLEDGE BASE PUBLICATION PENDING.

Controls 75.1 through 75.8 are implemented and verified against their defined boundaries. Targeted and full regression verification is GREEN. Backend and frontend production builds are GREEN. Authentication, tenant scope, Trainer commercial access, RBAC, Trainer-client relationship boundaries, request validation, AI provider constraints, explainability, privacy and audit implications have been verified. No Mission 075 migration or package dependency change was required. Staging deployment and authenticated live behavioral verification are GREEN.

Mission 075 will be marked **CLOSED** after Knowledge Base production publication and verification of the immutable and canonical Mission 075 pages.