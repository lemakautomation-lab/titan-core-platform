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

Mission 052 remains ACTIVE / INCOMPLETE. Option B narrowed architecture is approved after
the partial historical implementation. Bounded closure controls 052-R1 through 052-R7,
verification and formal sign-off remain outstanding.

## 5. MISSION NOTES

MISSION-055.1-IMPLEMENTATION-NOTES.md is the closure record for the completed Mission 055.1.

## 7. FORMALLY DEFERRED RISKS

Mission 055.1 did not invent a Performance Measurement freshness limit. Freshness remains
a consuming decision/adaptation-policy concern, not a universal persistence constraint.

Composite tenant/athlete/metric integrity for PerformanceMetric and
PerformanceMeasurement is now a mandatory Mission 052 closure invariant assigned to
Control 052-R3. The exact safe database design is not prescribed by R0. Broader composite
integrity outside the narrowed Performance Engine remains separately governed.

## 6. DO NOT ASSUME

The continuity package must not be used as a substitute for repository inspection.
