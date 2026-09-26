# TITAN Health staging feature verification

Date: 26 September 2026 (SAST)  
Environment: `https://staging.titan-tech.co.za`  
Purpose: synthetic staging verification for the October live release. This register records observed behavior separately from automated tests and release claims.

## Evidence baseline

- Authentication rate-limit fix: commit `a000fc877d77f92d6ea95f39ba0a7ccf508ad40e`. Local guarded `titan_core_test`: 221 backend files, 1,378 tests passed. Focused frontend App, AppRouter and auth service: 55 tests passed. Synthetic Athlete sign-in and dashboard opening were reported by the operator after deployment.
- Visual identity: commit `2e5d8f3fa863bfa7dd83727000623c1b3a00de84`; desktop crop correction `e3cb7fef076659701a782a3937a31ae211ffdf3c`. Frontend build and lint passed; 51 focused App, Dashboard and AppRouter tests passed. The served hero image matched the committed SHA256 `f8ca2693d3230695f5156c07097a1e19d1a79f75d1757e4f1ab40124806909a9`.
- Public staging page and health endpoint returned HTTP 200 after the visual deployment. The login screen was visually inspected after the crop correction. The male athlete is visible and the form is readable.
- A synthetic, unentitled Athlete account was used in a secure browser sign-in. No credential or token is recorded here.

## Live route checks

| Area | Route | Live result | Next evidence needed |
| --- | --- | --- | --- |
| Sign-in | `/login` | **PASS**: synthetic sign-in succeeded; desktop visual inspected. | Mobile visual, error and recovery scenarios. |
| Athlete signup | `/signup/athlete` | **PARTIAL**: form and return navigation rendered. | Controlled new synthetic registration and onboarding persistence. |
| Trainer signup | `/signup/trainer` | **NOT RUN**. | Controlled synthetic registration and entitlement gating. |
| Account assistance | `/account-assistance` | **PASS**: generated a private reference; value omitted. | Rate-limit and failure-path checks. |
| Password request | `/forgot-password` | **PARTIAL**: page and return navigation rendered. | Submit a synthetic email; inspect delivery without exposing token. |
| Password reset | `/reset-password` | **NOT RUN**. | Controlled reset link and invalid-token cases. |
| Athlete onboarding | `/onboarding` | **PASS**: authenticated synthetic Athlete landed here. Payment-unavailable message displayed. | Complete paid entitlement flow when checkout exists. |
| Dashboard | `/dashboard` | **PASS for gate**: unentitled Athlete redirected to onboarding. A prior operator session opened the dashboard, but its workflow was not inspected in this session. | Entitled Athlete or role-specific synthetic account; dashboard data and actions. |
| Trainer | `/trainer` | **BLOCKED** by lack of a controlled entitled Trainer account. | Profile, access, client and programme workflow. |
| Coach | `/coach` | **BLOCKED** by lack of a controlled Coach account. | Squad and relationship workflow. |
| Performance Professional | `/performance-professional` | **BLOCKED** by required permissions and athlete relationship fixture. | Sports science, conditioning, nutrition and rehabilitation cases. |
| Club | `/club` | **BLOCKED** by `club.executives.read` and related synthetic data. | Executive panels and role-specific access. |
| Performance Director | `/performance-director` | **BLOCKED** by command-centre permission and data. | Intelligence, teams, reports and decisions. |
| Users | `/users` | **BLOCKED** by `users.read` test account. | Tenant-scoped list and negative access. |
| Sports | `/sports` | **BLOCKED** by `sports.read` test account. | Tenant-scoped list and actions. |
| Performance metrics | `/performance-metrics` | **BLOCKED** by `performance-metrics.read` test account. | Data, trends and failure states. |
| Exercises | `/exercises` | **BLOCKED** by `exercises.read` test account. | Library and programme-facing flows. |
| Athlete Digital Twin | `/athlete-digital-twin/:athleteId` | **BLOCKED** by permission and synthetic athlete fixture. | Own/related athlete access and cross-tenant denial. |

## Release gaps and next test sequence

1. Prepare controlled **staging-only** role accounts and tenant-scoped fixtures through the existing application authorization boundary. Do not grant broad permissions to the unentitled Athlete merely to open pages. No staging seed or provisioning script was found in the inspected locations.
2. Test each route with the least-privilege role, representative data, empty state, validation failure, forbidden access and cross-tenant denial. Record HTTP outcomes and UI behavior without credentials, tokens or private identifiers.
3. Test signup, recovery and payment only with synthetic identities. Checkout is currently unavailable; paid access remains blocked.
4. Verify mobile layout and accessibility for public auth, onboarding and role-specific pages; resolve failures before release classification.
5. Mission 071 remains **OPEN**: live wearable provider connector and release verification are outstanding. This staging register does not close it or certify all missions.

## Status rule

**PASS** means a specific live behavior was observed. **PARTIAL** means navigation or rendering was observed but the transaction was not completed. **BLOCKED** means a required account, entitlement, permission or fixture is absent. Automated regression passing does not upgrade a live route to PASS.
