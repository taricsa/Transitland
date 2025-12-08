# Transitland Fleet OS

Fleet Operating System for Transitland - A comprehensive fleet management solution built with Next.js, Supabase, and PowerSync.

## Overview

Transitland Fleet OS is designed to shift fleet operations from reactive firefighting to proactive, data-driven fleet orchestration. The system provides real-time visibility, offline-first capabilities, and role-based views for mechanics, operations managers, parts clerks, and drivers.

## Tech Stack

- **Framework**: Next.js 16+ (App Router with Turbopack)
- **Language**: TypeScript 5.9+
- **Database**: Supabase (PostgreSQL)
- **Offline Sync**: PowerSync
- **PWA**: next-pwa
- **Styling**: Tailwind CSS 4.x
- **UI Components**: HeadlessUI
- **Forms**: React Hook Form + Zod
- **State Management**: Zustand + React Query

## Features

### User Roles & Views

1. **Mechanic View (Wrench View)**
   - Work order queue
   - Work order detail and management
   - Offline-first CRUD operations
   - Big button, high-contrast UI for shop floor use

2. **Operations Manager View (Control Tower)**
   - Real-time fleet availability dashboard
   - KPI cards (Availability %, Mechanic Utilization %, Winter Readiness %)
   - Interactive garage status map
   - Mechanic roster

3. **Parts Clerk View (Warehouse View)**
   - Inventory grid with real-time stock tracking
   - Low stock alerts
   - Restock forms
   - Auto-decrement on part usage

4. **Driver View (Input Portal)**
   - Digital Vehicle Inspection Report (DVIR)
   - Simplified issue reporting wizard
   - Auto-work order creation for critical failures

### Core Features

- **Offline-First Architecture**: Full functionality without internet connection
- **Real-time Updates**: WebSocket-based real-time dashboard updates
- **Priority Matrix**: Auto-assignment of P0-P3 priorities based on issue type
- **Winterization Protocol**: Automatic checklist injection (Oct 1 - Nov 1)
- **Vehicle State Machine**: Enforced state transitions
- **Inventory Management**: Real-time stock tracking with auto-decrement
- **User Authentication**: Secure login/logout with role-based access control
- **Demo Data**: Comprehensive seed scripts for testing and demos

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- PowerSync account (optional for offline sync)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Transitland
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your Supabase and PowerSync credentials. The `.env.local` file has been created with your Supabase credentials.

4. Run database migrations in Supabase:
   
   **Option A: Using Supabase Dashboard (Recommended)**
   1. Go to your Supabase project dashboard: https://supabase.com/dashboard
   2. Navigate to **SQL Editor**
   3. Execute the migration files in order:
      - Copy and paste the contents of `db/migrations/001_initial_schema.sql` and run it
      - Copy and paste the contents of `db/migrations/002_analytics_tables.sql` and run it
      - Copy and paste the contents of `db/migrations/003_functions_triggers.sql` and run it
   
   **Option B: Using Supabase CLI**
   ```bash
   # Install Supabase CLI if not already installed
   npm install -g supabase
   
   # Link to your project
   supabase link --project-ref roraxigbthyrzzwgddiy
   
   # Run migrations
   supabase db push
   ```

5. Set up test accounts (optional):
   
   See `db/README_SEED_DATA.md` for detailed instructions. Quick setup:
   1. Create auth users in Supabase Dashboard (Authentication > Users > Add User):
      - `mechanic@transitland.test` / `TestMechanic123!`
      - `ops@transitland.test` / `TestOps123!`
      - `clerk@transitland.test` / `TestClerk123!`
      - `driver@transitland.test` / `TestDriver123!`
   2. Run `db/migrations/004_seed_test_data.sql` to create user profiles
   
   Or use the SQL-based approach:
   1. Run `db/migrations/005_create_auth_users.sql` to create auth users
   2. Run `db/migrations/006_seed_users_after_auth.sql` to create user profiles

6. Set up demo data (optional, for full demo scenario):
   
   See `db/README_DEMO_DATA.md` for detailed instructions. This creates:
   - 2 garages (North: 175 buses, South: 125 buses)
   - 300 buses with realistic data
   - Inventory items and stock
   - Work orders showing maintenance backlog
   
   ```sql
   -- Run in Supabase SQL Editor:
   -- 1. db/migrations/007_seed_demo_data.sql
   -- 2. db/migrations/008_assign_users_to_demo_garages.sql (to assign test users to North Garage)
   ```

7. Start the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /(auth)          - Authentication routes
  /(dashboard)    - Protected routes
    /mechanic     - Mechanic view
    /ops          - Operations manager view
    /clerk        - Parts clerk view
    /driver       - Driver view
/components
  /ui             - Shared UI components
  /features       - Feature-specific components
/lib
  /supabase       - Supabase client configuration
  /powersync      - PowerSync integration
  /services       - Business logic services
  /hooks          - React hooks
  /utils          - Utility functions
/db
  /migrations     - Database migration files
  README_SEED_DATA.md - Test account setup guide
  README_DEMO_DATA.md - Demo data setup guide
/types            - TypeScript type definitions
```

## Database Schema

The database is organized into two layers:

### Operational Tables (OLTP)
- `garages` - Location context
- `vehicles` - Asset registry
- `users` - Identity (extends Supabase auth)
- `mechanics` - Mechanic profiles
- `drivers` - Driver profiles
- `work_orders` - Transactional core
- `work_order_events` - Audit log
- `inventory_items` - Global catalog
- `inventory_stock` - Local stock per garage

### Analytics Tables (OLAP)
- `daily_garage_stats` - Fleet health metrics
- `mechanic_daily_logs` - Efficiency tracking
- `driver_risk_scores` - Driver impact scoring
- `stockout_events` - Supply chain tracking
- `seasonal_campaigns` - Winterization tracking

## Business Logic

### Priority Matrix
- **P0 (Critical)**: Safety/Compliance issues (Brakes, Wheelchair Lift) - Same-day fix
- **P1 (High)**: Service impacting (A/C, Heater, Engine) - 24h fix
- **P2 (Medium)**: Performance/Efficiency - 3-5 days
- **P3 (Deferrable)**: Cosmetic - Next scheduled service

### Winterization Protocol
- **Start**: October 1st
- **Deadline**: November 1st
- Automatic checklist injection for non-winterized vehicles
- Vehicles blocked from dispatch after deadline if not winterized

### Vehicle State Machine
Valid transitions:
- AVAILABLE → IN_SERVICE, MAINTENANCE_DUE, IN_MAINTENANCE, OUT_OF_SERVICE
- IN_SERVICE → AVAILABLE, MAINTENANCE_DUE, OUT_OF_SERVICE
- MAINTENANCE_DUE → IN_MAINTENANCE, OUT_OF_SERVICE
- IN_MAINTENANCE → AVAILABLE, OUT_OF_SERVICE
- OUT_OF_SERVICE → IN_MAINTENANCE, AVAILABLE

## Development

### Branch Strategy
- `main` → Production
- `stage` → Testing/Staging
- `develop` → Development

### Test Accounts

The following test accounts are available for development and testing:

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Mechanic | `mechanic@transitland.test` | `TestMechanic123!` | `/mechanic` |
| Ops Manager | `ops@transitland.test` | `TestOps123!` | `/ops` |
| Parts Clerk | `clerk@transitland.test` | `TestClerk123!` | `/clerk` |
| Driver | `driver@transitland.test` | `TestDriver123!` | `/driver` |

All accounts have logout functionality accessible from their respective dashboards.

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm start
```

## Deployment

The application is configured for deployment on Vercel/Netlify with branch-based deployments:
- `main` branch → Production
- `stage` branch → Staging
- `develop` branch → Development preview

## License

[Your License Here]

## Support

For issues and questions, please contact the development team.

