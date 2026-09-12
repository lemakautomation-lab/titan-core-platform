---
title: "Security Diagram"
slug: /security/config-security-diagram/
sidebar_position: 2
---

> **Authoritative repository source:** `config/Security-Diagram.md`

Users
                  │
          Multi-Factor Authentication
                  │
           Authentication Service
                  │
          Role-Based Authorisation
                  │
             API Gateway (HTTPS)
                  │
            Backend Services
                  │
          PostgreSQL Database
                  │
        Encrypted Backups
                  │
      Monitoring & Audit Logs
