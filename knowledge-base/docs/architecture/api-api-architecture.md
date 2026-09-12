---
title: "API Architecture"
slug: /architecture/api-api-architecture/
sidebar_position: 2
---

> **Authoritative repository source:** `api/API-Architecture.md`

Client
   │
   ▼
API Gateway
   │
   ▼
Authentication
   │
   ▼
Business Services
   │
   ├── Users
   ├── Health
   ├── AI
   ├── Products
   ├── Notifications
   └── Reports
   │
   ▼
Database
