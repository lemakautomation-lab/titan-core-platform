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

Mission 052 narrowed technical acceptance is satisfied. R0–R6 are complete, verified,
committed and pushed. R7 sign-off content is prepared; its commit/push remains pending.

## 5. MISSION NOTES

MISSION-055.1-IMPLEMENTATION-NOTES.md is the closure record for the completed Mission 055.1.

## 7. FORMALLY DEFERRED RISKS

Mission 055.1 did not invent a Performance Measurement freshness limit. Freshness remains
a consuming decision/adaptation-policy concern, not a universal persistence constraint.

Composite tenant/Athlete integrity is closed by R3; provenance/idempotency/correction by
R4/R5; the minimum API by R5; Measurement RBAC and correction audit by R5/R6; bounded list
exposure by R5; and direct persistence/API coverage by R3–R6. High-volume storage,
retention and advanced projections remain successor scope.

## 6. DO NOT ASSUME

The continuity package must not be used as a substitute for repository inspection.
