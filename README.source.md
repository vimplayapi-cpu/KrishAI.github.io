# KrishAI Hub — Delivery Package

## Architecture Overview

KrishAI Hub is a full-stack AI-powered agricultural platform with three distinct access layers:

1. **Customer App** (Light Clay Neumorphic UI) — Served at root `/` and feature routes
   - Role-gated: Farmer (farms, scan, markets), Student (research, reports), All (advisor, products)
   - Deep onboarding wizard with region/climate profiling
   - My Profile page for identity and farm/academic details management

2. **Admin Backoffice** (Dark SaaS Control Room) — Served at `/admin`
   - Dedicated dark shell, completely separate from customer app
   - Customer 360 view, Approvals queue, Uploaded Data manager
   - Feature flags, system settings, audit logs, health monitoring

3. **Backend** (tRPC + Express + MySQL/TiDB)
   - Region-based recommendation engine (server/recommendations.ts)
   - Approval workflows for scans, uploads, and research papers
   - Demo auth (demo/123456) with role persistence

## Setup Instructions

### Prerequisites
- Node.js 22+ and pnpm
- MySQL 8+ or TiDB Cloud (schema in master.sql)

### Frontend (client/)
```bash
cd client
cp ../env.sample .env  # fill in VITE_* vars
pnpm install
pnpm dev
```

### Backend (server/)
```bash
cd server  # (from project root: pnpm install first)
cp ../env.sample .env  # fill in DATABASE_URL, JWT_SECRET
pnpm drizzle-kit generate  # if schema changed
pnpm dev
```

### Database
Import master.sql into your MySQL/TiDB instance.

## Login
- URL: http://localhost:3000
- Credentials: demo / 123456
- Role selection: Farmer or Student (persisted per session)
- Admin access: first login as any role; /admin route available

## Key Files
- `client/src/components/OnboardingWizard.tsx` — Deep questionnaire
- `client/src/admin/` — Dedicated admin backoffice panels
- `server/adminRouter.ts` — Admin API (360 view, approvals, flags)
- `server/recommendations.ts` — Region-based recommendation engine
