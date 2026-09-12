---
title: "Infrastructure Diagram"
slug: /operations/infrastructure-infrastructure-diagram/
sidebar_position: 5
---

> **Authoritative repository source:** `infrastructure/Infrastructure-Diagram.md`

Internet
                    │
          Load Balancer / CDN
                    │
             Web Frontend
                    │
              API Gateway
                    │
        ┌───────────┼───────────┐
        │           │           │
 Authentication   AI Services  Backend
        │           │           │
        └───────────┼───────────┘
                    │
             PostgreSQL Database
                    │
         File Storage / Backups
                    │
        Monitoring / Logging
