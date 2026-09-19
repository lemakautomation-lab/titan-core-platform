# Mission 060 — Wearable Connectors

## Status

ACTIVE

## Objective

Integrate approved wearable providers progressively through provider-specific backend connectors while preserving the provider-independent Mission 059 domain boundaries.

## Classification

BACKEND-ONLY

Frontend changes are excluded unless a later authoritative control explicitly requires them.

## Authoritative Foundation

Mission 059 established the following provider-independent contracts:

- `WearableDevicePort`
- `Device`
- `DeviceIngestionPort`
- `DeviceNormalizationPort`
- `DeviceAthleteAssociationService`
- `DeviceIntegrationFailurePort`

Mission 060 implementations must use these boundaries without introducing provider-specific assumptions into the domain layer.

## Control 060.0 — Mission Governance Baseline

**Status:** COMPLETE / VERIFIED

### Authorized Provider

Garmin is the first authorized wearable provider.

The initial integration target is the Garmin Connect Health API because it supplies all-day health data relevant to TITAN, including heart rate, sleep, steps, stress, respiration, Pulse Ox, Body Battery, body composition, calories, intensity minutes, and blood pressure.

### Confirmed Provider Constraints

The publicly available Garmin documentation confirms:

- Cloud-to-cloud integration
- REST architecture
- JSON data
- OAuth 2.0
- End-user consent
- Push or Ping/Pull delivery options
- Evaluation-environment access after Garmin approval
- Commercial or metric-specific licensing conditions may apply

Detailed endpoints, schemas, credentials, scopes, delivery semantics, rate limits, verification requirements, and error contracts must not be invented. They require approved Garmin programme documentation.

### Security and Non-Regression Boundary

- No credentials or secrets may be committed to source control.
- Provider credentials must use established environment/configuration conventions.
- No tenant-isolation, RBAC, authentication, session, or account-security behaviour may be weakened.
- Provider payloads are untrusted external input and require explicit validation.
- Provider identities must not bypass tenant-scoped athlete association.
- Provider failures must pass through the Mission 059 integration-failure boundary.
- Tests must not require live Garmin credentials or network access.
- Historical migrations must not be modified.
- Existing unrelated dirty-tree changes must remain untouched.
- No persistence, database schema, API, retry policy, or frontend surface is authorized by this control.

### Acceptance Criteria

- Mission 060 scope is explicit.
- Garmin is recorded as the first authorized provider.
- Publicly confirmed Garmin integration constraints are recorded.
- Restricted and deferred scope is explicit.
- Mission 059 abstractions remain unchanged.
- No runtime behaviour is introduced.

### Verification Evidence

- TypeScript build: **GREEN**
- Targeted Mission 059/060 regression: **6/6 test files GREEN; 10/10 tests GREEN**
- Full serial backend regression: **89/89 test files GREEN; 743/743 tests GREEN**
- Runtime source changes: **NONE**
- Database and migration changes: **NONE**
- Frontend changes: **NONE**
- Existing unrelated dirty-tree changes remained protected.
### References

- https://developer.garmin.com/gc-developer-program/overview/
- https://developer.garmin.com/gc-developer-program/health-api/
- https://developer.garmin.com/gc-developer-program/program-faq/

## Control 060.0A — Provider Expansion Governance

**Status:** IMPLEMENTED / PENDING VERIFICATION

### Decision

Mission 060 is expanded from a single-provider delivery sequence to a
provider-progressive wearable integration programme while preserving the
provider-independent Mission 059 domain boundaries.

The authorized provider targets are:

1. Garmin Health — cloud-to-cloud provider integration.
2. Apple HealthKit — Apple-platform health-data integration.
3. Samsung Health — Android/Samsung Health data integration.

Garmin remains an authorized provider and its existing Control 060.1 is not
reclassified as implemented. Garmin-specific implementation remains blocked
where authoritative programme documentation, approval, credentials, schemas,
or provider-controlled access are required.

Apple HealthKit and Samsung Health may progress only through separately
authorized controls supported by authoritative provider documentation.

### Architectural Boundary

All provider implementations must adapt to the existing Mission 059 contracts:

- `WearableDevicePort`
- `DeviceIngestionPort`
- `DeviceNormalizationPort`
- `DeviceIntegrationFailurePort`
- `DeviceAthleteAssociationService`
- `Device`

Provider-specific concepts must not leak into the provider-independent domain
layer.

### Security Boundary

- Health and wearable payloads are untrusted external input.
- Explicit user authorization and consent requirements must be preserved.
- Only the minimum required health-data permissions may be requested.
- Provider identity must never substitute for TITAN tenant and athlete
  authorization.
- Secrets, tokens, signing material, credentials, and private keys must never
  be committed to source control.
- Production credentials must use TITAN environment/configuration boundaries.
- Provider failures must use the Mission 059 integration-failure boundary.
- Tests must not depend on live provider credentials or external network access.
- Tenant isolation, RBAC, authentication, session security, and audit controls
  must not be weakened.

### Delivery Boundary

This governance control does not authorize:

- provider payload schemas not supported by authoritative documentation;
- fabricated endpoints, scopes, callbacks, or error contracts;
- database persistence;
- Prisma schema changes or migrations;
- public API exposure;
- frontend implementation;
- scheduled synchronization;
- retry orchestration;
- production credential provisioning.

Those changes require a separately authorized Mission 060 control.

### External Dependencies

Provider-controlled approval, registration, licensing, production credentials,
application verification, and commercial access are external release
dependencies where required by the provider.

External dependencies must be recorded explicitly and must not be represented
as verified TITAN functionality until evidence exists.

### Acceptance Criteria

- Garmin remains an authorized Mission 060 provider.
- Apple HealthKit is authorized as an additional provider target.
- Samsung Health is authorized as an additional provider target.
- Mission 059 contracts remain unchanged.
- Existing Garmin Control 060.1 blocker remains truthful.
- No runtime behaviour is introduced by this control.
- No database or migration change is introduced.
- No frontend behaviour is introduced.
- No provider credentials or secrets are introduced.
- Existing unrelated working-tree changes remain untouched.

## Control 060.1 — Garmin Health Connector Contract

**Status:** BLOCKED / NOT STARTED

Implementation requires Garmin programme approval and access to the authoritative Health API specification.

Until that specification is available, the following remain unauthorized:

- Endpoint definitions
- Payload schemas
- OAuth client implementation
- Consent callback behaviour
- Push or Ping/Pull selection
- Rate-limit handling
- Retry/backoff policy
- Persistence
- API exposure
- Frontend behaviour

## Deferred Scope

All providers other than Garmin, Garmin Activity/Training/Courses APIs, persistence, public API exposure, frontend behaviour, scheduled synchronization, retry orchestration, and production credential provisioning remain deferred unless separately authorized.
