---
title: "Mission 074 - AI ATHLETE ASSISTANT"
slug: /missions/074/
sidebar_position: 74
---

# Mission 074 - AI ATHLETE ASSISTANT

> Authoritative scope imported from the TITAN Master Mission Control Register.

## Objective

Provide a personal AI performance assistant.

## Delivery Classification

- **Frontend classification:** FRONTEND-VISIBLE
Local frontend expectation: visible change is expected only where the listed mission controls require a user-facing workflow, page, visualisation or verification surface.

## Controls

### Control 74.1 - Athlete-scoped AI context

**Status:** LOCALLY VERIFIED / RELEASE PENDING (29 September 2026). Mission remains ACTIVE.

**Design:** Authenticated `GET /api/v1/ai-athlete-assistant/context` derives the personal athlete from the session user and tenant. It reuses the Mission 071 identity boundary to require an active user and active athlete. All query inputs, including supplied tenant, athlete, user or prompt identifiers, are rejected. The minimal no-store response exposes only the authorised athlete ID, context version, personal access mode, purpose and `generationAvailable: false`. There is no provider call, source-data retrieval, generated guidance, persistence, migration or frontend change in this foundation control. Authorised retrieval follows in 74.2; guidance and its visible workflow follow in later controls.

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Local evidence:** Targeted personal-context API gate: one file, four tests passed. Adjacent Mission 071 intelligence regression: nine files, 20 tests passed. Backend TypeScript build passed; lint had zero errors and 31 existing warnings. Knowledge Base build and `git diff --check` passed. Staging smoke and publication of this control remain outstanding. No provider integration, generated guidance, frontend delivery or production release is claimed.

### Control 74.2 - Authorised data retrieval

**Status:** LOCALLY VERIFIED / RELEASE PENDING (30 September 2026). Mission remains ACTIVE.

**Design:** Authenticated personal `GET /api/v1/ai-athlete-assistant/data` resolves the signed-in athlete through 74.1 and composes Mission 071 sources. Training, nutrition, recovery, wearables, performance tests, goals and sport requirements each retain their independent read permission and active identity checks. Denied sources are null; authorised empty snapshots remain distinguishable. Query scope overrides are rejected, responses are no-store, and no prompt, provider request, generated guidance or persisted assistant record is created. Existing bounded source readers determine each snapshot size.

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Local evidence:** Assistant/intelligence regression: 11 files, 27 tests passed. Backend TypeScript build passed; lint had zero errors and 31 existing warnings. Knowledge Base build and diff check passed. Commit `9ac34a4cd3cf113fa21d837634fd5a1915528a05` pushed. Staging verification/publication remain pending.

### Control 74.3 - Performance guidance

**Status:** LOCAL AND STAGING VERIFICATION PASSED / KB PUBLICATION PENDING (30 September 2026). Mission remains ACTIVE.

**Design:** Authenticated personal `POST /api/v1/ai-athlete-assistant/guidance` accepts only `{consent: true}`; query overrides and arbitrary prompts are rejected. It reuses 74.2 independent source permission checks. The outbound projection includes only governed goal categories and bounded existing training frequencies; identities, names, free text, health observations and other source records are excluded. Insufficient permitted facts prevent an API call. The dashboard provides an explicit per-request transfer acknowledgement and generation button, plain-text guidance, loading, insufficient-data and unavailable states. No automatic generation occurs on mount.

**Provider:** Server-only OpenAI Responses API; disabled unless `ATHLETE_AI_ENABLED=true` and `OPENAI_API_KEY` is configured. `OPENAI_MODEL` defaults to `gpt-4.1-mini-2025-04-14`. Strict structured outputs, `store:false`, no tools, 700 output tokens, 20-second timeout, no retries and three requests per authenticated account per minute per backend instance. Provider bodies/errors and credentials are not returned. Output is validated for exact shape, bounded lengths and plain text. Prompts constrain guidance to conservative support, without diagnosis, prescriptions or changing a professional plan. Prompt constraints and structural checks do not prove all generated content safe; live evaluation remains required.

**Privacy and release limits:** `store:false` does not imply zero retention; provider abuse-monitoring retention policies apply. This slice does not send recovery, nutrition or wearable measurements. No persistence, migration or package dependency is introduced. Model access/billing, live provider behavior, UI verification and staging deployment remain pending. Distributed quota enforcement, richer explanations/confidence, escalation controls and the AI audit trail are not claimed complete; 74.4–74.7 remain outstanding. Mission remains ACTIVE.

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Verification evidence (30 September 2026):** Backend assistant/intelligence regression passed: 13 files, 40 tests. After the control-character lint correction, guidance unit tests, backend build/lint, dashboard tests, frontend build and Docusaurus build passed. Implementation commit: `7baa65269193a4409624f91a62a8895db218fc43`. Staging configuration and deployed revision: `675490ce63dec4c039c0e2263eecb734aaa30a41`. Backend and web rebuilt successfully. The dashboard insufficient-data state was verified. Live OpenAI returned HTTP 200 and validated structured guidance. Authenticated synthetic API smoke verified denied goals withheld, supplied scope rejected with 400, and permitted generation returned 200/GENERATED. Synthetic fixtures were removed; security history retained. Existing staging athlete permissions were unchanged. Broader AI safety evaluation, remaining controls 74.4–74.7, mission regression and production readiness are not claimed complete.

### Control 74.4 - Explainable responses

**Status:** LOCAL AND STAGING VERIFICATION PASSED / KB PUBLICATION PENDING (30 September 2026). Mission remains ACTIVE.

**Design:** Both generated and insufficient-data responses include an additive server-generated `explanation` envelope: version, source retrieval timestamp, the exact bounded goal/frequency projection, and independent source states `WITHHELD`, `NO_USABLE_FACTS` or `USED`. The explanation is captured before provider invocation and is not accepted from model output. It contains no names, account IDs or raw text. Denied sources remain withheld; authorised empty or filtered snapshots are distinguished. This records the input basis, not a claim that every generated statement is supported or an account of the model's internal reasoning.

**Visible workflow:** The existing assistant panel labels AI-generated suggestions separately from the TITAN source summary. It shows which categories and per-programme frequencies were shared, unavailable/withheld sources, retrieval time and the bounded selection size. It explicitly distinguishes planned frequency from completed workouts or measured progress. Insufficient-data responses explain that no facts were sent to OpenAI. The existing endpoint, provider request, consent and permission boundaries remain in place. No migration, new provider call or package dependency is introduced.

**Remaining gates:** KB publication and live verification. Remaining controls and production readiness are not claimed complete.

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Verification evidence (30 September 2026):** Assistant/intelligence and dashboard regression, backend/frontend builds, backend lint, Docusaurus build and diff check passed. Implementation and staging revision: `b2e5563fe559da1f21a4301124c88f861d4df2d4`. Backend and web containers were rebuilt and verified running. Visible insufficient-data explanation verified withheld sources, retrieval timestamp and no-provider-call notice. Authenticated synthetic generation returned HTTP 200/GENERATED with explanation version 1, goals `[STRENGTH]`, no training frequencies, goals USED and training WITHHELD. The retrieval timestamp was valid. Synthetic fixture removed; security history retained.

### Control 74.5 - Limitations/confidence where appropriate

**Status:** IMPLEMENTED / LOCAL VERIFICATION PENDING (30 September 2026). Mission remains ACTIVE.

**Design:** Both generated and insufficient-data responses include an additive server-generated `limitations` envelope. Coverage is derived solely from the usable outbound projection: `NONE`, `GOALS_ONLY`, `TRAINING_ONLY` or `GOALS_AND_TRAINING`. This is input coverage, not model quality, clinical confidence, completeness of an athlete profile or measured progress. Confidence is always `NOT_ASSESSED`; no numeric score or inferred high-confidence state is created. Metadata is captured before the provider call and is not supplied by the model.

**Visible workflow:** The dashboard shows plain-language data coverage, confidence not assessed, and fixed limitations: unassessed response accuracy, plans versus completed training/progress/readiness, excluded measurements and health context, retrieval time versus underlying record currency, and the need to check suggestions against the current professional plan. Coverage of both input categories still retains every limitation. Denied or unusable sources do not increase coverage. Existing personal scope, consent, bounded projection and no-data/no-call behavior remain in place. No migration, new provider request or package dependency is introduced.

**Pending gates:** Assistant/intelligence and dashboard regression, builds/lint, staging coverage smoke, visible UI verification and KB publication. Clinical advice, calibrated model confidence, complete AI safety verification, 74.6–74.7 and production readiness are not claimed complete.

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 74.6 - Human/professional escalation boundary

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 74.7 - AI audit trail

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

## Mission Exit Gate

all controls implemented or explicitly verified as already satisfied; targeted tests GREEN; relevant regression GREEN; build GREEN; security/tenant/RBAC implications verified; migration/API contract verified where applicable; documentation/evidence captured.
