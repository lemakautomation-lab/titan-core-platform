# MISSION 055 â€” EXERCISE PROGRAMME GENERATION ENGINE

## Status

ACTIVE

Current control: R7 - Final governance, documentation, and mission sign-off.

Mission 055 R0 through R6R are RELEASED / VERIFIED / COMMITTED / PUSHED. R7 records final governance and documentation closure.
NOT STARTED / NOT AUTHORIZED.

## Prospective Establishment and Historical Identity

Mission 055 is established prospectively from the approved TITAN Health Master
Development Road Map and current repository inspection. It did not previously exist as a
standalone committed mission specification. The roadmap governs product direction; the
current repository remains authoritative for implementation facts.

Mission 055.1 predates this formal definition and remains historically unchanged:

Mission 055.1: COMPLETE / VERIFIED / COMMITTED / PUSHED.

Mission 055.1 supplied reusable programme adaptation, transaction, concurrency, audit,
tenant-isolation and security foundations. It did not implement initial Exercise Programme
Generation and does not satisfy Mission 055 acceptance. It is not renamed or rewritten,
and this mission does not imply or create a Mission 055.2.

## Product and Enterprise Boundary

TITAN Enterprise is the top-level platform and portfolio. TITAN Health is one product under
TITAN Enterprise, and Mission 055 belongs to TITAN Health.

Mission 055 extends the current TITAN Health domain. It does not establish a universal
enterprise Programme Generation service or authorize moving current Health code into
generic shared services without concrete cross-product evidence.

## Purpose

Establish a production-grade foundation for deterministic initial Exercise Programme
Generation from authoritative, validated inputs: Athlete, structured Goal, Sport where
applicable, experience, available equipment, training frequency, session duration, eligible
Exercises and a governed generation ruleset/version.

The authoritative result must be tenant-safe, Athlete-scoped, deterministic for the same
inputs and ruleset, persisted as structured programme/session/exercise prescriptions,
auditable, retry-safe, concurrency-safe and protected by dedicated authorization.

## Architecture Decisions

### Existing aggregate

The existing `WorkoutProgramme` remains the programme aggregate/root concept. Generation
extends that architecture with structured generated content; it does not replace the
aggregate without evidence.

### Generation inputs and minimum Goal semantics

Generation must use governed authoritative inputs sufficient to identify the Athlete,
structured Goal, applicable Sport, experience, available equipment, training frequency,
session duration, eligible Exercises and ruleset/version.

Mission 055 requires only the Goal semantics necessary for generation:

- controlled Goal classification;
- primary/priority semantics;
- an optional bounded target where applicable;
- an optional target date or time horizon where applicable;
- tenant and Athlete ownership;
- sufficient immutable or snapshotted Goal context to explain a generation decision.

R1 determines the exact physical and domain representation. A broad future Goal Engine is
not part of this mission.

### Programme structure

Generated output requires this minimum hierarchy:

Programme â†’ ordered Sessions â†’ ordered Exercise Prescriptions.

A prescription must contain enough governed information to execute the generated
programme, including ordering, Exercise identity and an appropriate bounded prescription
such as sets/repetitions, duration, rest or intensity where applicable. The structure must
carry generation/version identity. R2 determines the exact representation without
prematurely modelling every future training modality.

### Exercise eligibility

The current Exercise Library remains authoritative and is not replaced. The current bounded
assumption is tenant-owned Exercise eligibility; shared/global Exercise ownership requires a
separate later architecture decision.

Eligibility must consider, where applicable, tenant ownership, active lifecycle, Sport,
equipment, difficulty/experience, training objective/Goal and governed Exercise metadata.

### Determinism and server authority

Identical authoritative inputs and the same ruleset/version must produce the same
authoritative output. Uncontrolled randomness is prohibited. Any future controlled
variability must use explicit seed/version semantics and be reproducible.

The server is authoritative for tenant, actor, Athlete scope, ownership, eligible Exercise
set, rules and persisted structure. A client-submitted supposedly generated programme must
never be trusted as authoritative output.

### Generation identity, retry and concurrency

Each generation operation/result requires an authoritative identity supporting retry safety,
idempotency, concurrent duplicate arbitration, ruleset/version association and audit
correlation. R5 chooses the persistence mechanics; R0 does not freeze an arbitrary method.

The authoritative structure must ultimately persist atomically. Concurrent duplicate
requests must not create uncontrolled duplicate authoritative results. Established
transaction and locking patterns should be reused where appropriate.

### Historical interpretability and regeneration

Generated output must retain sufficient immutable/versioned context so later changes to
Goal semantics, Exercise metadata or generation rules do not silently reinterpret history.

Regeneration remains within Mission 055 only as explicit lineage:

old generated version â†’ regeneration decision â†’ new generated version.

Regeneration must not silently overwrite history or become general Programme Progression.
Its exact mechanics and API belong to later controls.

### Coach override

Coach override remains an architecture requirement. Any future override requires explicit
authority, actor attribution, rationale where required, auditability and preservation of
generation history. Broad coaching workflows are excluded. If current role/relationship
semantics are insufficient, the externally exposed override operation may remain deferred
while this requirement is preserved.

### Audit

Successful authoritative generation must record tenant, actor, Athlete, generation identity,
relevant input/Goal context, ruleset/version, generated programme/version and outcome.
Where the success audit is mandatory, generated persistence and audit must be atomic.
Per-Exercise security noise is not required.

### Tenant and Athlete integrity

Defense in depth is required. Application-level tenant/Athlete ownership checks are
mandatory. Database-level composite integrity is required where relational ownership permits
it. Future database work must use new migrations and must never modify the protected
historical RBAC migration.

### Authorization

Generation requires dedicated authorization and is not automatically authorized by ordinary
Workout Programme CRUD permissions. The architecture may distinguish generation, reading
generated structure, regeneration and override. R6 determines the exact mapping.

### Failure semantics

Unsatisfiable authoritative constraints must fail explicitly and atomically. Generation must
not create an empty programme, partially persist, weaken ownership, select inactive or
ineligible Exercises, or silently ignore authoritative constraints.

## Mission 056 Boundary

Mission 055 owns initial generation. Mission 056 owns Programme Progression, including
ongoing volume, intensity and frequency changes; recovery-driven changes; general
performance-feedback progression; deload detection; progressive overload; and periodic
progression/revision policy.

The existing Mission 055.1 performance-driven adaptation remains intact as narrow historical
prior work. It does not collapse Mission 056 scope into Mission 055 and is not redesigned by
055-R0.

## Acceptance Contract

### Domain

- structured, validated generation request;
- minimum governed Goal semantics;
- ordered Programme/Session/Exercise Prescription structure;
- deterministic initial generation;
- governed frequency, duration, experience, Sport and equipment constraints;
- compatibility with existing Mission 055.1 behavior.

### Persistence

- atomic generated structure and authoritative generation identity;
- tenant/Athlete defense in depth and eligible Exercise relationships;
- retry, idempotency and concurrency authority;
- historical generation/version context;
- explicit regeneration lineage where retained.

### Application and API

- authenticated generation boundary and bounded generated-programme retrieval;
- principal-derived authority and tenant non-disclosure;
- generated operations clearly distinguished from ordinary manual CRUD.

### Security

- dedicated generation authorization;
- same-tenant Athlete, Sport, Goal and Exercise ownership enforcement;
- server-authoritative selection;
- permission-denial security events;
- retry and concurrency controls.

### Audit

- attributable generation and input/rules/version correlation;
- atomic audit where mandatory;
- regeneration/override lineage and rationale where applicable.

### Validation

- governed constraints and positive bounded frequency/duration;
- active eligible Exercises;
- structurally valid, non-empty results;
- explicit unsatisfiable-input failure.

### Testing

- domain semantics and deterministic selection;
- tenant/Athlete/Sport/Exercise ownership;
- RBAC, non-disclosure and validation;
- inactive Exercise exclusion;
- idempotency, concurrency and rollback;
- database integrity and API coverage;
- affected regressions, Prisma validation and backend build.

## Explicit Exclusions

- general Programme Progression Engine;
- Programme Delivery UI/workflow and exercise execution tracking;
- Body/BMI, Nutrition, AI/predictions, wearables or recovery;
- advanced Performance Measurement successor scope;
- generic enterprise extraction;
- Technical Library / Knowledge Hub;
- unrelated frontend work;
- broad Goal Engine or broad coach/client workflows;
- calendar/booking;
- commercial, payment or entitlement work.

## Control Plan

Mission 055 release ledger:

- 055-R0 — Architecture, Identity, and Acceptance Contract — RELEASED / VERIFIED / COMMITTED / PUSHED
- 055-R1 — Domain and Policy Foundation — RELEASED / VERIFIED / COMMITTED / PUSHED
- 055-R2 — Deterministic Generation Engine — RELEASED / VERIFIED / COMMITTED / PUSHED
- 055-R3 — Prescription Profile Integration — RELEASED / VERIFIED / COMMITTED / PUSHED
- 055-R4P-1 — Persistence and Retrieval Foundation — RELEASED / VERIFIED / COMMITTED / PUSHED
- 055-R4P-2 — Persistence and Retrieval Hardening — RELEASED / VERIFIED / COMMITTED / PUSHED
- 055-R4 — Persistence and Retrieval Release — RELEASED / VERIFIED / COMMITTED / PUSHED
- 055-R5-B1 — Generation Boundary Hardening — RELEASED / VERIFIED / COMMITTED / PUSHED
- 055-R5-B2 — Generation Security Hardening — RELEASED / VERIFIED / COMMITTED / PUSHED
- 055-R6 — Generated Programme Retrieval — RELEASED / VERIFIED / COMMITTED / PUSHED
- 055-R6R — Bounded Generated-Programme Retrieval — RELEASED / VERIFIED / COMMITTED / PUSHED
- 055-R7 — Regression Closure and Mission Sign-off — GOVERNANCE CLOSURE

Final implementation checkpoint: 562cac854cabab2b0a136448c738e9fb8cdf88c8.

Technical completion is separate from production enablement. Generation remains default-denied until the required workout-programmes.generate permission is provisioned and assigned through an approved tenant rollout, governed ExercisePrescriptionProfiles are authored, reviewed and activated, and production rollout and monitoring are approved.

Deferred capabilities: frontend generation UI, regeneration, coach override, prescription-profile administration API/UI, active profile population, and progression. Mission 056 owns Programme Progression.
