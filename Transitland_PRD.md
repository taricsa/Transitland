# **Transitland Fleet Management Transformation: Strategic Product Definition & Implementation Plan**

Prepared By: Senior Product Team (PM, Architecture, Design, Logistics)  
Date: December 8, 2024  
Version: 1.4

## **1\. Executive Summary & Team Introduction**

Transitland is currently trapped in a "maintenance death spiral," where reactive repairs consume all available capacity, forcing the deferral of preventive maintenance, which in turn causes more breakdowns. Our team has designed a **Fleet Operating System (Fleet OS)** to break this cycle.

**The Mission:** Shift Transitland from reactive firefighting to proactive, data-driven fleet orchestration.

**The Team:**

* **Product Manager:** Focus on value delivery, stakeholder alignment (Mechanics, Ops, Parts), and the roadmap.  
* **Logistics SME:** Expert in paratransit compliance (ADA), seasonal operations, and garage workflows.  
* **Solution Architect:** Responsible for the Next.js \+ Supabase "vibe-coding" stack, offline-first data strategies, and security.  
* **Senior Designer:** Championing the "shop-floor first" UI/UX to ensure adoption by non-desk workers.

## **2\. Strategic Context: Hypothesis & Assumptions**

### **2.1 Problem Statement**

The current reliance on analog tools (sticky notes, physical logbooks) and fragmented communication (WhatsApp) has created an opaque operational environment. With **20-30 buses out of service (10% downtime)**, the fleet is underutilized, and inventory stockouts are frequent.

### **2.2 Core Hypothesis**

**If** we provide a unified, real-time source of truth for vehicle health, maintenance schedules, and parts availability via an offline-capable tool, **then** Transitland can shift 20% of its labor hours from reactive to preventive maintenance within 90 days, reducing unscheduled downtime to \<5%.

### **2.3 Key Assumptions**

* **Regulatory Constraints:** As a paratransit provider, a wheelchair lift failure renders a bus legally inoperable (ADA compliance), regardless of engine health.  
* **Connectivity:** Garages have Wi-Fi, but dead zones exist. An **"Offline-First"** architecture is non-negotiable.  
* **Workforce:** Mechanics are skilled technicians but not data entry clerks. The UI must require \<30 seconds to log a task.  
* **Seasonality:** Operations are heavily weather-dependent. "Winterization" is a critical, distinct operational phase.

## **3\. Business Process Re-engineering**

### **3.1 Current State (The "Chaos" Workflow)**

1. **Issue Detection:** Driver notices a rattle or lift failure.  
2. **Reporting:** Issue reported via radio or sticky note left on the dashboard.  
3. **Black Hole:** Note falls off or is illegible. Mechanic A diagnoses the issue but lacks parts. Mechanic B re-diagnoses the same issue the next day.  
4. **Stockout:** Parts Clerk realizes the alternator belt is out of stock only *after* the bus is on the lift.  
5. **Result:** Bus sits for 3 days; Ops Manager discovers it's unavailable only at 5:00 AM pull-out.

### **3.2 Future State (The "Fleet OS" Workflow)**

1. **Digital Ingestion:** Driver/Mechanic logs issue in PWA. Auto-assigned Priority (e.g., Lift Failure \= **P0**).  
2. **Intelligent Triage:** System checks parts inventory.  
   * *If In Stock:* Auto-reserves part.  
   * *If Out of Stock:* Alerts Clerk immediately.  
3. **Execution:** Mechanic opens work order. System flags "Winter Prep" is also due, consolidating two shop visits into one.  
4. **Resolution:** Mechanic closes ticket. Dashboard updates instantly via WebSocket.  
5. **Feedback Loop:** "Driver Wear Score" updates based on the repair type (e.g., brake pads vs. electrical).

## **4\. Business Logic & Rules**

### **4.1 Vehicle State Machine**

* **AVAILABLE:** Ready for dispatch.  
* **IN\_SERVICE:** Currently on route.  
* **MAINTENANCE\_DUE:** PM due within \<500 miles or 7 days.  
* **IN\_MAINTENANCE:** Active Work Order (WO) open.  
* **OUT\_OF\_SERVICE:** Critical safety/compliance failure (e.g., Lift broken).

### **4.2 Priority Matrix**

* **P0 (Critical):** Safety/Compliance issue (Brakes, Wheelchair Lift). Target: *Same-day fix.*  
* **P1 (High):** Service impacting (A/C in summer, Heater in winter). Target: *24h fix.*  
* **P2 (Medium):** Performance/Efficiency (Minor leaks). Target: *3-5 days.*  
* **P3 (Deferrable):** Cosmetic (Torn seat, dent). Target: *Next scheduled service.*

### **4.3 Seasonal Logic (The "Winterization" Protocol)**

* **Trigger:** October 1st (Start of Campaign).  
* **Logic:** If Date \> Oct 1 AND Vehicle\_Status \!= Winterized, inject "Winter Checklist" (Anti-gel, Heater check, Tire tread \> 4/32") into *any* active WO.  
* **Deadline:** November 1st. Any non-winterized vehicle becomes DO\_NOT\_DISPATCH after this date.

### **4.4 Driver Impact Scoring**

To identify training needs, we correlate repairs to drivers.

$$Driver Cost Score \= \\frac{\\text{Cost of Avoidable Repairs (Brakes, Susp)}}{\\text{Miles Driven}}$$

* *High Score* triggers "Defensive Driving Training" recommendation.

## **5\. Product Requirements Document (PRD)**

### **5.1 User Personas & View Segmentation**

The application requires distinct interface modes ("Views") tailored to the specific context of each user type. A Driver on a rainy curb needs a different screen than a Clerk at a desk.

1. **Maria (Mechanic) \- "The Wrench View"**  
   * **Context:** Shop floor, greasy hands, tablet device.  
   * **Needs:** Big buttons, high contrast. "What is my next job?" "Does this bus have parts?"  
   * **View Features:** Work Order Queue (Assigned to Me), Vehicle History Lookup, Barcode Scanner (Parts).  
2. **David (Ops Manager) \- "The Control Tower View"**  
   * **Context:** Office desktop or laptop.  
   * **Needs:** Aggregated data. "Can I meet service demand tomorrow?" "Who is efficient?"  
   * **View Features:** Fleet Status Map, Mechanic Rostering, KPI Dashboard (Availability, Turnaround Time).  
3. **Sandra (Parts Clerk) \- "The Warehouse View"**  
   * **Context:** Stockroom, desktop or handheld scanner.  
   * **Needs:** Inventory accuracy. "What do I need to order today?"  
   * **View Features:** Inventory Grid, Low Stock Alerts, Intake/Restock Form, Supplier Management.  
4. **Tom (Driver) \- "The Input Portal"**  
   * **Context:** Driver's seat, mobile phone.  
   * **Needs:** Speed and simplicity. "I hear a rattle, I log it, I drive."  
   * **View Features:** Digital Vehicle Inspection Report (DVIR) Form, "Report Issue" (Wizard style), Vehicle Assignment Status.

### **5.2 Functional Specifications**

#### **Feature 1: The "Control Tower" Dashboard (Ops Manager View)**

* **Requirement:** Real-time visibility of Fleet Availability.  
* **KPIs:** Fleet Availability %, Critical Issues (unassigned P0/P1), Mean Time To Repair (MTTR), Active Mechanics count.  
* **Visual:** Searchable Fleet Status table with vehicle details and quick actions.  
* **Garage Filtering:** Dropdown selector to filter all dashboard data by garage (All, North, South).  
* **Triage Queue:** Real-time list of unassigned critical work orders requiring immediate attention.  
* **Work Order Assignment:** Modal interface to assign work orders to mechanics with garage-based filtering.  
* **Schedule Planning:** Dedicated page for preventive maintenance scheduling and work order time slot management.  
* **Vehicle Management:** Individual vehicle detail pages with status updates, work order history, and quick actions.  
* **Work Order Detail:** Comprehensive work order pages with editable fields, parts tracking, hours management, and mechanic assignment.

#### **Feature 2: Offline-First Work Order Management (Mechanic View)**

* **Requirement:** CRUD operations for WOs.  
* **Detail:** Must function without internet. Syncs automatically when connection is restored.  
* **Inputs:** Voice-to-text notes, photo upload (for damage), barcode scan (for parts).

#### **Feature 3: Inventory Command Center (Parts Clerk View)**

* **Requirement:** Real-time stock tracking and reorder logic.  
* **Detail:** Auto-decrement stock when Mechanic "uses" part in WO.  
* **Alerts:** Critical stockout warnings for seasonal items (e.g., Winter Tires).

#### **Feature 4: Driver Intake Portal (Driver View)**

* **Requirement:** Simplified issue logging to reduce barrier to entry.  
* **Detail:** "Pre-Trip Inspection" checklist.  
* **Logic:** If "Critical Fail" (e.g., Brakes) is selected \-\> Auto-create P0 Work Order \-\> Alert Ops Manager immediately.

### **5.3 Technical Architecture (The "Vibe-Coding" Stack)**

* **Framework:** **Next.js (App Router)**. Robust, server-side rendering for dashboards.  
* **Database & Auth:** **Supabase**.  
  * *PostgreSQL* for relational integrity (Buses \<-\> Drivers).  
  * *Realtime* (WebSockets) for instant dashboard updates.  
* **PWA Layer:** **Serwist** or **next-pwa** for offline caching and service workers.  
* **Styling:** **Tailwind CSS**. Mobile-first utility classes for rapid iteration.  
* **Sync Engine:** **RxDB** or **PowerSync** (Local-first replication strategy).

### **5.4 Data Model (ERD Highlights)**

The schema is designed with two layers: **Operational (OLTP)** for real-time transactions and **Analytical (OLAP)** for historical metric tracking. This separation ensures that calculating "Last Month's Fleet Availability" doesn't slow down the Mechanic trying to log a repair today.

#### **Layer 1: Operational Tables (The "Now")**

| Table | Critical Fields | Purpose & Relationships |
| :---- | :---- | :---- |
| garages | id, name, total\_bays, timezone | **Location Context.** Root entity for all physical assets and staff. |
| vehicles | id, vin, status, garage\_id, current\_driver\_id, current\_tire\_set\_id, winterized\_bool | **Asset Registry.** Belongs to a Garage. Tracks *current* state. |
| users | id, auth\_id, role, garage\_id, name | **Identity.** Single table for Mechanics, Ops, Clerks, and Drivers. |
| mechanics | id, user\_id, specialty, shift\_pattern | **Workforce Extension.** Extends users for mechanic-specific attributes. |
| drivers | id, user\_id, license\_expiry, current\_vehicle\_id | **Driver Extension.** Extends users for driver-specific attributes. |
| work\_orders | id, vehicle\_id, assigned\_mechanic\_id, priority (P0-P3), status (Open/Waiting/Closed), type (Preventive/Repair) | **Transactional Core.** The single source of truth for maintenance activity. |
| work\_order\_events | id, work\_order\_id, event\_type (Status Change, Part Used), timestamp, user\_id | **Audit Log.** precise timestamping for calculating "Time in Status" (Velocity). |
| inventory\_items | id, sku, name, category (Seasonal/Regular), min\_threshold | **Global Catalog.** Definitions of parts. |
| inventory\_stock | id, inventory\_item\_id, garage\_id, quantity\_on\_hand | **Local Stock.** Quantity of a specific item at a specific garage. |

#### **Layer 2: Metrics & Analytics Tables (The "History")**

We presume these tables are populated via a nightly cron job or database trigger (e.g., Supabase Edge Functions).

| Metric Category | Table Name | Columns | Why needed? |
| :---- | :---- | :---- | :---- |
| **Fleet Health** | daily\_garage\_stats | date, garage\_id, total\_vehicles, vehicles\_down, vehicles\_available, availability\_rate | Fast querying of the "North Star Metric" trend without counting raw rows every time. |
| **Efficiency** | mechanic\_daily\_logs | date, mechanic\_id, hours\_logged, tickets\_closed, wrench\_efficiency\_score | To calculate Utilization % and identify training needs. |
| **Driver Impact** | driver\_risk\_scores | month, driver\_id, miles\_driven, avoidable\_repair\_count, cost\_per\_mile, risk\_score (0-100) | Tracks the "Driver Wear Score" over time to prove if training is working. |
| **Supply Chain** | stockout\_events | id, work\_order\_id, part\_id, garage\_id, hours\_delayed | Explicitly tracks *impact* of parts shortages. Used for "Parts Stockout Rate." |
| **Seasonality** | seasonal\_campaigns | id, campaign\_name (Winter 2024), start\_date, end\_date, target\_vehicles\_count, completed\_vehicles\_count | Tracks the "Winterization" progress bar on the dashboard. |

*Note: We strictly separate users (Auth) from mechanics/drivers (Profiles) to allow a user to potentially change roles or work across multiple garages in V2.*

## **6\. Metrics & Measurement Framework**

One of the most critical things of the App are the metrics.

### **6.1 North Star Metric**

* **Fleet Availability Rate:** Percentage of buses available for service (target: 92% → 95%)

### **6.2 Input Metrics (Leading Indicators)**

* **System Adoption:** % of maintenance events logged digitally (target: 90% by Day 30\)  
* **Work Order Velocity:** Average days from creation to completion by priority  
* **Parts Stockout Rate:** % of work orders delayed due to parts unavailability  
* **Dashboard Usage:** Daily active operations managers (indicates planning behavior)

### **6.3 Output Metrics (Lagging Indicators)**

* **Fleet Availability:** Weekly average of buses in "Available" status  
* **Preventive vs. Reactive Ratio:** % of preventive maintenance work orders  
* **Maintenance Cost Per Mile:** Total maintenance spend / fleet mileage  
* **Mean Time To Repair (MTTR):** Average hours from issue log to completion (Implemented: Calculated from closed work orders with actual_hours)

### **6.4 Business Impact Metrics (90-Day)**

* **Service Reliability:** Reduction in missed service due to vehicle unavailability  
* **Rider Complaints:** Decrease in complaints related to vehicle issues  
* **Operating Costs:** Reduction in emergency repair costs vs. preventive maintenance  
* **Staff Satisfaction:** NPS from mechanics and operations managers

## **7\. Implementation Plan (2-Week Sprint)**

Our strategy is **"Depth in Function, Width in V2."** We prioritize a fully functional loop for Mechanics over broad analytics for Executives in Phase 1\.

### **Week 1: Foundation & Data**

* **Day 1-2 (Arch):** Init Next.js \+ Supabase. Configure PWA manifest and Service Workers.  
* **Day 1-2 (Product):** Cleanse Vehicle and Driver rosters (CSV). Define "Winter Prep" checklist items.  
* **Day 3-5 (Dev):** Build "Digital Logbook" (WO CRUD). Implement Local-first sync logic.  
* **Day 3-5 (Design):** Dashboard UI High-Fidelity. "Big Button" mobile layout for Mechanics.

### **Week 2: Logic & Operations**

* **Day 6-7 (Dev):** Implement Priority Logic (P0-P3) and Inventory decrement logic.  
* **Day 8 (Dev):** Build "Ops Dashboard" with Realtime Supabase hooks.  
* **Day 9 (QA/SME):** Field test in "Dead Zone" (simulate offline mode). Verify Sync.  
* **Day 10 (Launch):** Deploy to tablets. Training session with North Garage lead mechanics.

### **Post-Launch (V2 Roadmap)**

* **Week 4:** Automated Telematics integration (Odometer sync).  
* **Week 6:** Predictive Maintenance Model (AI based on component MTBF).  
* **Week 8:** Driver Training Module integration.

**Signed:**

* *Product Manager*  
* *Solution Architect*  
* *Senior Designer*  
* *Logistics SME*