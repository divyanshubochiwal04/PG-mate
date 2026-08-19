# 🏢 M Square (PG-Mate)

> **Enterprise-Grade, Multi-Tenant SaaS Platform for PG & Hostel Operations, Commercials, Mess, and Financial Analytics.**

![React Native](https://img.shields.io/badge/Mobile-React%20Native%20%2F%20Expo-61DAFB?logo=react)
![NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E?logo=nestjs)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Supabase-336791?logo=postgresql)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript)
![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-EF4444?logo=turborepo)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌟 Executive Overview

**M Square** is a comprehensive full-stack PG (Paying Guest) and Hostel management ecosystem designed to streamline end-to-end property administration. Built as a true **Multi-Tenant SaaS**, it offers strict organization-level isolation, real-time inventory allocation, automated billing, mess ledger, and predictive business forecasting.

---

## 🚀 Key Modules & Capabilities

### 🏢 1. True Multi-Tenant SaaS Architecture
- **Tenant Isolation**: Every PG owner operates within an isolated `organization_id` workspace.
- **Zero Data Leakage**: Enforced at the database & repository layers via strict tenant filtering.
- **Self-Serve Onboarding**: 10-second registration workflow with automatic organization and initial property provisioning.

### 🛏️ 2. Property & Room Inventory Hierarchy
- Multi-tier structure: **Organization → Property → Building → Floor → Room → Bed**.
- Real-time occupancy tracking, sharing configurations (Single, Double, Triple, 4-Sharing), and bed status indicators (🟢 Vacant, 🔴 Occupied, 🟡 Maintenance).
- Global cross-property view with instant filtering and search.

### 💬 3. 1-Click WhatsApp & In-App Rent Reminders
- Formats polite, urgent, and final overdue reminders with resident name, room number, outstanding dues, and due date.
- **Zero Third-Party Cost**: Direct OS deep link dispatch via WhatsApp + fallback to native share sheets.
- **Dynamic On-Screen UPI QR**: In-person scan-and-pay screen for instant settlement via GPay, PhonePe, and Paytm.

### ⚡ 4. Electricity Sub-Meter Calculator & Auto-Split
- Sub-meter reading inputs (Previous & Current kWh reading + Rate per Unit).
- Automatically calculates total room consumption and **divides the bill equally among all active bed occupants**.
- 1-Tap "Add to Invoices" & dispatches automated in-app notifications.

### 📊 5. PG Operational Expense Tracker & Real Net Profit
- Comprehensive ledger for daily and recurring operational costs (Kitchen ration, Milk, Staff salaries, Main electricity, Wi-Fi, Water tanker, Maintenance).
- Computes real-time **Net Operating Profit (₹)** and **Profit Margin %** (`Total Collections - Total Expenses`).

### 🍲 6. Mess Management, Timetable & Low Stock Alerts
- Full weekly breakfast, lunch, snacks, and dinner schedules.
- **Special Feast Broadcast**: Sunday Royal Feast & Festival dinner poster generator with in-app notification broadcast.
- **Kitchen Grocery Ledger**: Tracks staples (Aata, Basmati Rice, Oil, Dairy, LPG Cylinders) with automated **In-App Low Stock Warning** triggers.

### 🧾 7. Instant Branded Payment Receipts & Invoices
- Itemized billing breakdown (Rent, Wi-Fi, Maintenance, Electricity, Mess).
- Verified security badge, paid vs balance status, and 1-tap PDF printing and WhatsApp sharing.

### 🕒 8. Resident Lifecycle Timeline
- Complete chronological visual timeline on resident profiles:
  - 🚪 Onboarding & Check-in
  - 🔄 Room / Bed Transfers
  - 💳 Rent Collections & Receipts
  - 🛠️ Maintenance Complaints & Resolutions
  - 📤 Notice Period & Checkouts

### 📉 9. P&L Audit Export & Predictive Revenue Forecasting
- **1-Click Monthly P&L Export**: Formatted income vs expense audit statement ready to download or share with partners/accountants.
- **30-Day Revenue & Vacancy Forecast**: Capacity gap analysis showing projected revenue, 100% capacity potential, upcoming vacant beds, and revenue at risk from overdue dues.

---

## 🏗️ Monorepo Architecture

```
PG-mate/
├── apps/
│   ├── api/          # NestJS Backend API (PostgreSQL, Kysely, JWT, Swagger)
│   └── mobile/       # React Native Expo Mobile App (Expo Router, React Query)
├── packages/
│   ├── contracts/    # Shared TypeScript DTOs, interfaces & validation contracts
│   ├── database/     # Kysely DB layer, PostgreSQL migrations & seeders
│   ├── domain/       # Core business logic, domain entities & rules
│   ├── logger/       # Structured Winston logging utility
│   ├── security/     # Argon2 password hashing & JWT token handling
│   └── config/       # Shared environment configuration & validation
└── docs/             # Architecture Decision Records (ADRs) & documentation
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Mobile Frontend** | React Native, Expo 54, Expo Router, TypeScript |
| **Styling & Icons** | Vanilla React Native StyleSheet, Design System tokens, Expo Vector Icons |
| **Backend API** | NestJS, TypeScript, Node.js 18+, Swagger |
| **Database** | PostgreSQL / Supabase, Kysely Query Builder |
| **State Management** | TanStack React Query, React Context |
| **Security & Auth** | Argon2id, JWT (Access + Refresh token rotation) |
| **Build & Monorepo** | Turborepo, pnpm workspaces, EAS Build |

---

## ⚡ Quick Start

### Prerequisites
- Node.js (v18 or higher)
- pnpm (`npm i -g pnpm`)
- PostgreSQL (Local Docker or Supabase Cloud)

### 1. Installation
```bash
git clone https://github.com/divyanshubochiwal04/PG-mate.git
cd PG-mate
pnpm install
```

### 2. Environment Setup
Create `.env` in the root folder:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
```

And in `apps/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://[YOUR_IP]:3000/api/v1
```

### 3. Run Database Migrations
```bash
pnpm db:migrate
```

### 4. Start Development Servers
```bash
# Start both backend and mobile dev servers concurrently
pnpm dev
```

### 5. Running Tests
```bash
# Run unit & integration tests across monorepo
pnpm test

# Run TypeScript typechecks
pnpm typecheck
```

---

## 📱 Mobile APK Build (Android)

To generate a standalone `.apk` using EAS:
```bash
cd apps/mobile
npx eas-cli build -p android --profile preview
```

---

## 📄 License
This project is licensed under the MIT License.
