# BD-004 – Database Design

**Document ID:** BD-004

**Status:** Approved

**Version:** 1.0

---

# Purpose

This document defines the logical database architecture for the TITAN Core Platform.

The database must support multiple applications, multiple companies, millions of users and future AI services.

---

# Database Engine

Primary Database

PostgreSQL

Future Support

Redis

ElasticSearch

Object Storage

---

# Design Principles

• Normalised database

• High performance

• Secure

• Scalable

• Modular

• Cloud native

---

# Core Tables

## Users

Stores all platform users.

Fields include

- User ID
- First Name
- Last Name
- Email
- Password Hash
- Status
- Created Date

---

## Organisations

Stores every company using TITAN.

Fields

- Organisation ID

- Name

- Country

- Industry

- Subscription

---

## Teams

Groups users.

---

## Roles

Stores security roles.

Examples

Platform Admin

Company Admin

Manager

Staff

Customer

---

## Permissions

Stores individual permissions.

---

## Products

Stores every TITAN product.

Examples

TITAN Health

TITAN AI

TITAN Security

Future Products

---

## AI Conversations

Stores

- Chats

- Prompts

- Responses

- Tokens

- Models

---

## Health Records

Stores

- Weight

- Blood Pressure

- Sleep

- Exercise

- Nutrition

- Goals

---

## Notifications

Stores

Email

SMS

Push Notifications

---

## Audit Logs

Stores

Every security event.

Every login.

Every change.

---

## Files

Stores uploaded documents.

---

## Settings

Stores platform configuration.

---

# Relationships

One Organisation

↓

Many Users

One User

↓

Many Health Records

One User

↓

Many AI Conversations

One Role

↓

Many Permissions

---

# Security

Passwords are hashed.

Sensitive data encrypted.

Audit logging enabled.

---

# Scalability

Support millions of users.

Horizontal scaling.

Read replicas.

Automatic backups.

---

# Success Criteria

The database supports every current and future TITAN application.