---
title: Mission 001 - Project Architecture
slug: /missions/001/
sidebar_position: 1
---

# Mission 001 - Project Architecture

## Control 001.8D - Cloudflare Pages Deployment

**Status:** COMPLETE / VERIFIED

### Implementation

- Provider: Cloudflare Pages
- Repository integration: GitHub
- Production branch: `main`
- Root directory: `knowledge-base`
- Build command: `npm run build`
- Output directory: `build`
- Node runtime: `22`
- Deployment URL: `https://titan-core-platform.pages.dev/`

### Evidence

- Cloudflare production deployment succeeded.
- Anonymous HTTP verification returned `200` before Access protection.
- Deployed content contained `TITAN Knowledge Base`.
- No repository modification was required.

## Control 001.8E - Cloudflare Access Protection

**Status:** COMPLETE / VERIFIED

### Implementation

- Application: `TITAN Knowledge Base`
- Destination: `titan-core-platform.pages.dev`
- Policy action: `Allow`
- Identity provider: Cloudflare
- Authorized access is restricted by email policy.
- Application session duration: 12 hours.
- All unmatched requests are denied by default.

### Evidence

- Anonymous request returned `302`.
- Redirect destination was the TITAN Cloudflare Access domain.
- Authorized Cloudflare authentication and 2FA opened the Knowledge Base.
- No credentials, OTPs, policy identifiers or tokens are recorded here.

### Security Boundary

Cloudflare Access protects the current `pages.dev` deployment. Custom-domain configuration and verification require a separate controlled change.
