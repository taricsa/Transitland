# Replit Agent Instructions: Transitland Fleet OS

This document provides step-by-step prompts and instructions to rebuild the Transitland Fleet OS application using [Replit Agent](https://replit.com/products/agent).

## Project Overview

**Transitland Fleet OS** is a comprehensive fleet management solution designed to shift operations from reactive firefighting to proactive, data-driven fleet orchestration. The system provides real-time visibility, offline-first capabilities, and role-based views for mechanics, operations managers, parts clerks, and drivers.

## Tech Stack

- **Framework**: Next.js 16+ (App Router with Turbopack)
- **Language**: TypeScript 5.9+
- **Database**: Supabase (PostgreSQL)
- **Offline Sync**: PowerSync (optional)
- **PWA**: next-pwa
- **Styling**: Tailwind CSS 4.x
- **UI Components**: HeadlessUI
- **Forms**: React Hook Form + Zod
- **State Management**: Zustand + React Query

---

## Phase 1: Project Setup & Configuration

### Prompt 1: Initialize Next.js Project
```
Create a new Next.js 16 project with TypeScript, using the App Router and Turbopack. 
Set up the project structure with:
- TypeScript configuration
- Tailwind CSS 4.x with PostCSS
- ESLint configuration
- PWA support using next-pwa
- Environment variable setup (.env.example)

Project name: transitland-fleet-os
```

### Prompt 2: Install Dependencies
```
Install the following dependencies for the project:

Core:
- next@^16.0.7
- react@^19.2.1
- react-dom@^19.2.1
- typescript@^5.9.3

Styling:
- tailwindcss@^4.1.17
- @tailwindcss/postcss@^4.1.17
- autoprefixer@^10.4.20
- @headlessui/react@^2.2.9
- @heroicons/react@^2.2.0

Database & Auth:
- @supabase/supabase-js@^2.86.2
- @supabase/ssr@^0.8.0

Forms & Validation:
- react-hook-form@^7.68.0
- @hookform/resolvers@^5.2.2
- zod@^3.23.8

State Management:
- zustand@^5.0.9
- @tanstack/react-query@^5.90.12

PWA & Offline:
- next-pwa@^5.6.0
- @powersync/web@^1.0.0

Utilities:
- date-fns@^4.1.0
- clsx@^2.1.1
- tailwind-merge@^3.4.0

Dev Dependencies:
- @types/node@^22.10.5
- @types/react@^19.0.6
- @types/react-dom@^19.0.2
- eslint@^9.18.0
- eslint-config-next@^16.0.7
- postcss@^8.4.49
```

### Prompt 3: Configure Next.js & PWA
```
Configure next.config.js with:
- PWA support using next-pwa (disabled in development)
- Turbopack configuration for Next.js 16
- Image domains configuration
- React strict mode enabled

Create postcss.config.js with Tailwind CSS 4.x PostCSS plugin.

Update app/globals.css with Tailwind CSS v4 import pattern:
@import "tailwindcss";
```

---

## Phase 2: Database Schema & Types

### Prompt 4: Create TypeScript Type Definitions
```
Create types/index.ts with the following TypeScript definitions:

Enums:
- VehicleStatus (AVAILABLE, IN_SERVICE, MAINTENANCE_DUE, IN_MAINTENANCE, OUT_OF_SERVICE)
- WorkOrderPriority (P0, P1, P2, P3)
- WorkOrderStatus (OPEN, WAITING, IN_PROGRESS, CLOSED, CANCELLED)
- WorkOrderType (PREVENTIVE, REPAIR)
- UserRole (MECHANIC, OPS_MANAGER, PARTS_CLERK, DRIVER)
- InventoryCategory (SEASONAL, REGULAR)

Interfaces:
- Garage
- User (id, role, garage_id, name, email, phone, timestamps)
- Mechanic
- Driver
- Vehicle (with all fields including VIN, status, garage_id, odometer, service dates)
- WorkOrder (with all fields including priority, status, assigned_mechanic_id)
- WorkOrderPart
- InventoryItem
- InventoryStock
- And all other related types

Ensure all interfaces match the database schema exactly.
```

### Prompt 5: Create Database Schema SQL
```
Create db/migrations/001_initial_schema.sql with the following PostgreSQL schema:

Tables:
1. garages (id, name, total_bays, timezone, address, timestamps)
2. users (id references auth.users, role, garage_id, name, email, phone, timestamps)
   - Note: id is the primary key and foreign key to auth.users, no separate auth_id column
3. mechanics (id, user_id, specialty, shift_pattern, certification_level, timestamps)
4. drivers (id, user_id, license_expiry, current_vehicle_id, timestamps)
5. vehicles (id, vin, status, garage_id, current_driver_id, winterized_bool, make, model, year, odometer, service dates, timestamps)
6. work_orders (id, vehicle_id, assigned_mechanic_id, priority, status, type, title, description, issue_type, estimated_hours, actual_hours, cost, created_by, timestamps, closed_at)
7. work_order_parts (id, work_order_id, inventory_item_id, quantity, garage_id, timestamps)
8. inventory_items (id, sku, name, category, min_threshold, unit_cost, timestamps)
9. inventory_stock (id, inventory_item_id, garage_id, quantity_on_hand, reserved_quantity, location, timestamps)

Add appropriate indexes, foreign keys, and constraints.
Enable uuid-ossp and pg_trgm extensions.
```

---

## Phase 3: Supabase Integration

### Prompt 6: Create Supabase Client Configuration
```
Create lib/supabase/client.ts:
- Use @supabase/ssr createBrowserClient
- Handle missing environment variables gracefully
- Export createClient() function
- Use Database type from types/database.ts

Create lib/supabase/server.ts:
- Use @supabase/ssr createServerClient
- Handle cookies properly for Next.js server components
- Export createClient() async function
```

### Prompt 7: Create Authentication Utilities
```
Create lib/utils/auth.ts with:
- getCurrentUser(): Get current authenticated user with role
- requireAuth(): Ensure user is authenticated
- requireRole(role): Ensure user has specific role
- getDashboardPath(role): Get dashboard path for user role

Create lib/utils/logout.ts with:
- handleLogout(): Sign out user and redirect to login
```

### Prompt 8: Create Middleware for Route Protection
```
Create middleware.ts:
- Protect dashboard routes (/mechanic, /ops, /clerk, /driver)
- Redirect unauthenticated users to /login
- Enforce role-based access control
- Redirect authenticated users away from landing/auth pages to their dashboards
- Handle missing environment variables gracefully
- Use proper error handling for auth and database queries
```

---

## Phase 4: UI Components & Design System

### Prompt 9: Create Base UI Components
```
Create a professional industrial dark mode design system using Tailwind CSS.

Create components/ui/ with:
- Badge.tsx - Status badges with color variants
- Button.tsx - Primary, secondary, and variant buttons
- Card.tsx - Container cards with borders and shadows
- Input.tsx - Form input fields with proper styling
- Textarea.tsx - Text area component
- Select.tsx - Dropdown select component
- OfflineIndicator.tsx - Shows offline status
- SyncStatus.tsx - Shows sync status with PowerSync

Use slate/zinc color palette for dark mode professional industrial aesthetic.
All components should be accessible and responsive.
```

### Prompt 10: Create Landing Page
```
Create app/page.tsx with:
- Professional industrial dark mode design (slate-950 background)
- Hero section with "Transitland Fleet OS" title
- Feature cards (Real-time Visibility, Offline-First, Role-Based Views, Smart Automation)
- "Sign In" button linking to /login
- Auto-redirect authenticated users to their dashboards
- Subtle gradient overlays and grid patterns
- Modern, clean typography
```

### Prompt 11: Create Login Page
```
Create app/(auth)/login/page.tsx with:
- Professional industrial dark mode design matching landing page
- Email and password input fields
- Error handling and display
- Loading states
- Redirect to appropriate dashboard based on user role after login
- Simplified redirect logic (no code repetition)
- Form validation
```

---

## Phase 5: Business Logic & Utilities

### Prompt 12: Create Vehicle State Machine
```
Create lib/utils/vehicleStateMachine.ts with:
- canTransition(currentStatus, newStatus): Validate state transitions
- getValidNextStates(status, vehicle): Get allowed next states
- getStatusColor(status): Get color for status badge
- getStatusLabel(status): Get human-readable label

Valid transitions:
- AVAILABLE → IN_SERVICE, MAINTENANCE_DUE, IN_MAINTENANCE, OUT_OF_SERVICE
- IN_SERVICE → AVAILABLE, MAINTENANCE_DUE, OUT_OF_SERVICE
- MAINTENANCE_DUE → IN_MAINTENANCE, OUT_OF_SERVICE
- IN_MAINTENANCE → AVAILABLE, OUT_OF_SERVICE
- OUT_OF_SERVICE → IN_MAINTENANCE, AVAILABLE
```

### Prompt 13: Create Priority Matrix Logic
```
Create lib/utils/priorityMatrix.ts with:
- calculatePriority(issueType, vehicleStatus): Auto-assign P0-P3 priority
- Priority rules:
  - P0: Safety/Compliance (Brakes, Wheelchair Lift) - Same-day fix
  - P1: Service impacting (A/C, Heater, Engine) - 24h fix
  - P2: Performance/Efficiency - 3-5 days
  - P3: Cosmetic - Next scheduled service
```

### Prompt 14: Create Winterization Protocol
```
Create lib/utils/winterization.ts with:
- isWinterizationPeriod(): Check if current date is Oct 1 - Nov 1
- shouldInjectWinterChecklist(vehicle, workOrder): Determine if winter checklist needed
- getWinterChecklistItems(): Return winterization checklist items
```

### Prompt 15: Create Service Layer
```
Create lib/services/vehicles.ts:
- VehicleService class with methods:
  - getVehicleById(id)
  - getVehicleByVIN(vin)
  - getVehiclesByGarage(garageId)
  - getVehiclesByStatus(status)
  - updateVehicleStatus(vehicleId, newStatus, currentStatus)
  - assignDriver(vehicleId, driverId)
  - updateOdometer(vehicleId, odometer)
  - markWinterized(vehicleId)
  - searchVehicles(query)

Create lib/services/driverReports.ts:
- createDriverReport(vehicleId, reportData)
- createWorkOrderFromReport(report)
- getDriverVehicle(driverId)

Create lib/services/workOrderPriority.ts:
- calculateWorkOrderPriority(issueType, vehicleStatus)
```

---

## Phase 6: React Hooks & Data Fetching

### Prompt 16: Create Work Orders Hook
```
Create lib/hooks/useWorkOrders.ts:
- useWorkOrders(mechanicId?): Custom hook for work order CRUD
- Features:
  - Load work orders (filtered by mechanic if provided)
  - Create work order
  - Update work order
  - Delete work order
  - Real-time subscriptions via Supabase
  - Offline queue support
  - Error handling
  - Loading states
```

### Prompt 17: Create Inventory Hook
```
Create lib/hooks/useInventory.ts:
- useInventory(garageId?): Custom hook for inventory management
- Features:
  - Load inventory with stock levels
  - Get low stock items
  - Get critical stock items
  - Restock items (with proper type safety using optional chaining)
  - Update stock quantities
  - Real-time subscriptions
  - Error handling
```

### Prompt 18: Create Realtime Dashboard Hook
```
Create lib/hooks/useRealtimeDashboard.ts:
- useRealtimeDashboard(garageId?): Custom hook for ops dashboard
- Features:
  - Load vehicles, work orders, mechanics
  - Calculate metrics:
    - Fleet availability rate
    - Critical issues count
    - MTTR (Mean Time To Repair) from closed work orders
    - Active mechanics count
    - Separate outOfServiceVehicles and downVehicles metrics
  - Real-time subscriptions for all data
  - Garage filtering support
  - Loading states
```

---

## Phase 7: Feature Components

### Prompt 19: Create Work Order Components
```
Create components/features/work-orders/:

WorkOrderForm.tsx:
- Form for creating/editing work orders
- Vehicle selection
- Priority assignment
- Type selection (Preventive/Repair)
- Issue type selection
- Description field
- Estimated hours
- Uses react-hook-form and zod validation

WorkOrderCard.tsx:
- Display work order summary
- Priority badge
- Status badge
- Click to view details

WorkOrderAssignmentModal.tsx:
- Modal for assigning work orders to mechanics
- Filter mechanics by garage
- Search functionality
- Assignment confirmation
```

### Prompt 20: Create Inventory Components
```
Create components/features/inventory/:

InventoryGrid.tsx:
- Display inventory items in grid/table
- Show stock levels per garage
- Low stock indicators
- Restock button per item

LowStockAlerts.tsx:
- Display critical and low stock alerts
- Color-coded by severity
- Action buttons

RestockForm.tsx:
- Form for restocking inventory
- Quantity input
- Validation
- Success/error handling
```

### Prompt 21: Create Driver Components
```
Create components/features/driver/:

DVIRForm.tsx:
- Digital Vehicle Inspection Report form
- Pre-trip inspection checklist
- Defect reporting
- Submit functionality

IssueReportWizard.tsx:
- Multi-step wizard for reporting issues
- Issue type selection
- Description
- Severity/priority
- Auto-creates work order for critical issues
```

---

## Phase 8: Dashboard Pages

### Prompt 22: Create Mechanic Dashboard
```
Create app/(dashboard)/mechanic/page.tsx:
- Display assigned work orders
- Work order queue with priority indicators
- "New Work Order" button
- Logout button
- Offline indicator
- Sync status
- Big buttons, high contrast for shop floor use
- Link to work order detail pages
```

### Prompt 23: Create Ops Manager Dashboard (Control Tower)
```
Create app/(dashboard)/ops/page.tsx:
- KPI Cards:
  - Fleet Availability %
  - Critical Issues (unassigned P0/P1)
  - MTTR (Mean Time To Repair)
  - Active Mechanics count
- Garage selector dropdown (All, North, South)
- Triage Queue: Unassigned critical work orders
- Fleet Status Table: Searchable vehicle list with:
  - VIN, Make/Model, Status, Details, Actions
  - "Manage" button linking to vehicle detail page
- "New Work Order" button
- "Plan Schedule" button
- Work order assignment modal integration
- Real-time updates
- Professional industrial dark mode design
```

### Prompt 24: Create Schedule Planning Page
```
Create app/(dashboard)/ops/schedule/page.tsx:
- Two tabs:
  1. Preventive Maintenance: Upcoming PMs (next 30 days)
  2. Work Order Time Slots: Unassigned work orders
- Vehicle cards with service dates
- "Schedule PM" buttons
- "View & Assign" buttons for work orders
- Garage filtering
- Proper TypeScript types (no 'any')
```

### Prompt 25: Create Vehicle Management Page
```
Create app/(dashboard)/ops/vehicles/[id]/page.tsx:
- Vehicle details card (make, model, year, VIN, status)
- Vehicle information (garage, odometer, service dates, winterized status)
- Work orders list for this vehicle
- Status update section with valid next states
- Quick actions (Create Work Order, Schedule PM)
- Real-time subscriptions
- Use useCallback for loadVehicleData to fix dependency issues
```

### Prompt 26: Create Work Order Detail Page (Ops)
```
Create app/(dashboard)/ops/work-orders/[id]/page.tsx:
- Comprehensive work order view
- Editable title and description (inline editing)
- Status and priority dropdowns
- Vehicle link
- Parts Used section:
  - List of parts with quantities
  - Add Part modal
  - Remove part functionality
  - Low stock warnings
- Assignment section:
  - Current assigned mechanic
  - Assign/Unassign buttons
  - Assignment modal
- Hours Tracking:
  - Estimated hours input
  - Actual hours input
  - Auto-save on blur
- Real-time updates
- Proper error handling
```

### Prompt 27: Create New Work Order Page
```
Create app/(dashboard)/ops/work-orders/new/page.tsx:
- Uses WorkOrderForm component
- Pre-fills vehicle and type from URL parameters
- Wrapped in Suspense for useSearchParams
- Back button
- Success redirect
```

### Prompt 28: Create Parts Clerk Dashboard
```
Create app/(dashboard)/clerk/page.tsx:
- Inventory grid display
- Low stock alerts
- Restock modal
- Garage filtering
- Real-time stock updates
- No unused functions (clean code)
```

### Prompt 29: Create Driver Dashboard
```
Create app/(dashboard)/driver/page.tsx:
- Current vehicle display
- Tabs for DVIR and Issue Reporting
- DVIR form integration
- Issue report wizard integration
- No vehicle assigned state
- Logout button
```

---

## Phase 9: Additional Features

### Prompt 30: Create Mechanic Work Order Pages
```
Create app/(dashboard)/mechanic/work-orders/[id]/page.tsx:
- Work order detail view for mechanics
- Status update controls
- Parts list
- Hours tracking
- Real-time updates

Create app/(dashboard)/mechanic/work-orders/new/page.tsx:
- Work order creation form
- Wrapped in Suspense for useSearchParams
```

### Prompt 31: Create Unauthorized Page
```
Create app/unauthorized/page.tsx:
- Error page for unauthorized access
- Link back to login
- Professional design matching app theme
```

---

## Phase 10: Environment Configuration

### Prompt 32: Create Environment Variables Template
```
Create .env.example with:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- POSTGRES_* variables (for reference)
- SUPABASE_URL
- SUPABASE_JWT_SECRET
- SUPABASE_SERVICE_ROLE_KEY

Do NOT include:
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (redundant)
- SUPABASE_PUBLISHABLE_KEY (redundant)
- SUPABASE_SECRET_KEY (deprecated)
```

---

## Phase 11: PowerSync Integration (Optional)

### Prompt 33: Create PowerSync Client
```
Create lib/powersync/client.ts:
- PowerSync schema definition for synced tables
- SupabaseConnector class
- fetchCredentials() method
- uploadData() method
- getPowerSyncDatabase() function
- Initialize PowerSync instance

Note: This requires PowerSync backend configuration which is external.
```

---

## Phase 12: Testing & Validation

### Prompt 34: Code Quality & Type Safety
```
Ensure the following:
- No TypeScript 'any' types (use specific types)
- All functions properly typed
- useCallback for functions in useEffect dependencies
- Optional chaining for safe property access
- Proper error handling throughout
- No unused functions or variables
- Consistent code style
- All linter warnings addressed (except minor CSS warnings)
```

### Prompt 35: Final Integration Check
```
Verify:
- All routes are protected by middleware
- Role-based access control works
- Real-time subscriptions function
- Offline indicators display correctly
- Forms validate properly
- Error states are handled
- Loading states are shown
- Logout functionality works on all pages
- Navigation flows correctly
```

---

## Additional Notes for Replit Agent

1. **Extended Thinking**: Enable Extended Thinking and High-Power Models for complex tasks like the dashboard hook or work order management.

2. **Database Setup**: After creating the schema SQL, you'll need to:
   - Set up a Supabase project
   - Run the migration SQL in Supabase SQL Editor
   - Configure environment variables

3. **Testing**: Agent will test its own work, but you should verify:
   - Authentication flows
   - Role-based routing
   - Real-time updates
   - Form submissions

4. **Design Consistency**: Maintain the "Professional Industrial Dark Mode" aesthetic throughout:
   - Slate/Zinc color palette
   - High contrast for readability
   - Clean, modern typography
   - Consistent spacing and borders

5. **Performance**: 
   - Use React Query for caching
   - Implement proper loading states
   - Optimize real-time subscriptions
   - Use useCallback for expensive operations

---

## Quick Start Commands

After building with Replit Agent:

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase credentials

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

---

## References

- [Replit Agent Documentation](https://replit.com/products/agent)
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS 4.x](https://tailwindcss.com/docs)

---

**Note**: This is a comprehensive application. Build it incrementally, testing each phase before moving to the next. Replit Agent's Extended Thinking mode will be helpful for complex components like the real-time dashboard hook and work order management system.

