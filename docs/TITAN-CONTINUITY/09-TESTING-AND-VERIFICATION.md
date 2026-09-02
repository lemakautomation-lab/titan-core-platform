# Testing and Verification

## BUILD

From backend:

npm run build

## FULL TEST

npm test

## CURRENT METHOD

For a new control:

1. inspect;
2. run targeted test;
3. diagnose;
4. implement smallest correct fix;
5. build;
6. run broader regression;
7. verify.

## HISTORICAL EVIDENCE

Mission 054-era serial backend regression:

34 test files / 142 tests / 0 failures.

Authorization regression:

44/44 GREEN.

Login:

5/5 GREEN.

Refresh-token:

6/6 GREEN.

Logout/session authorization:

4/4 GREEN.

These historical results do not prove the current dirty worktree is GREEN.

## MISSION 055.1 CLOSURE EVIDENCE

At commit `4563d49`:

- Performance Measurement application suite: 8/8 GREEN;
- relevant serial regression: 6 files / 32 tests / 0 failures;
- backend TypeScript build: GREEN.

The relevant serial regression covered Performance Measurement application behaviour,
Performance Metric API behaviour, athlete adaptation application behaviour, transactional
rollback/evidence validation, adaptation API tenant/RBAC/concurrency controls and existing
Workout Programme API behaviour.

## TEST ISOLATION LESSON

The project has previously experienced integration-test interference from concurrent access to the same test database.

Serial execution was deterministic.

Never treat a flaky shared-database test as proof of a production defect without diagnosis.
