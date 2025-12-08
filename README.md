# Transitland Fleet OS

Fleet Operating System for Transitland - A comprehensive fleet management solution built with Next.js, Supabase, and PowerSync.

## Overview

Transitland Fleet OS is designed to shift fleet operations from reactive firefighting to proactive, data-driven fleet orchestration. The system provides real-time visibility, offline-first capabilities, and role-based views for mechanics, operations managers, parts clerks, and drivers.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Offline Sync**: PowerSync
- **PWA**: next-pwa
- **Styling**: Tailwind CSS
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

Fill in your Supabase and PowerSync credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_POWERSYNC_URL=your_powersync_url
POWERSYNC_API_KEY=your_powersync_api_key
```

4. Run database migrations:
   - Execute SQL files in `db/migrations/` in order:
     - `001_initial_schema.sql`
     - `002_analytics_tables.sql`
     - `003_functions_triggers.sql`

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

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

