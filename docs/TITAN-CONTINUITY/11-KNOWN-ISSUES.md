# Known Issues / Open Items

## 1. DIRTY WORKTREE

The current repository contains multiple modified/untracked files.

These include unrelated frontend/product/Prisma changes and the untracked continuity package.

They must be classified before committing.

## 2. PRODUCT BILLING TERMINOLOGY

A previous Product API regression found:

Expected:
YEARLY

Received:
ANNUALLY

This must be verified against the current repository before being considered permanently closed.

## 3. TEST CONCURRENCY

Integration tests can interfere when sharing the same test database concurrently.

Serial execution has previously produced deterministic results.

## 4. MISSION 052 GOVERNANCE

Mission 052 remains ACTIVE / INCOMPLETE. Partial Performance Metric and Performance
Measurement foundations exist, but architecture/data-strategy approval, remaining
acceptance criteria and formal sign-off are outstanding.

## 5. MISSION NOTES

MISSION-055.1-IMPLEMENTATION-NOTES.md is the closure record for the completed Mission 055.1.

## 7. FORMALLY DEFERRED RISKS

Mission 055.1 did not invent a Performance Measurement freshness limit. A governed
freshness policy remains deferred. Composite tenant/athlete database constraints across
Athlete, PerformanceMetric, PerformanceMeasurement and WorkoutProgramme also remain
deferred to a dedicated data-integrity control.

## 6. DO NOT ASSUME

The continuity package must not be used as a substitute for repository inspection.
