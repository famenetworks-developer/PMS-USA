# HotelOS — Enterprise Hotel Property Management System

**HotelOS** is a comprehensive, production-grade Hotel Property Management System (PMS) engineered for luxury boutique hotels, expansive resorts, and multi-property hospitality enterprises. Inspired by luxury hotel digital aesthetics, HotelOS centralizes administrative and operational workflows into a unified platform.

---

## 1. Visual Identity & Design Principles

HotelOS adopts the hospitality design language extracted directly from the reference site:
- **Rich Espresso Slate (`#171411`)**: Deep, low-glare dark luxury backdrop designed for all-day operational comfort.
- **Charcoal Surfaces (`#24201c` / `#2c2722`)**: Elevated panel surfaces with hairline borders (`rgba(255, 255, 255, 0.08)`).
- **Hospitality Amber & Champagne Gold (`#ef8f31` / `#d8a855`)**: Vibrant focal accents reflecting warmth and premium hospitality.
- **Warm Ivory Linen Typography (`#f5eee4`)**: Combining **Playfair Display** (editorial serif headings with tracking) and **Plus Jakarta Sans** (high-clarity enterprise UI data).
- **Uppercase Kickers**: Gold tracking headers (`letter-spacing: 0.2em`) establishing clear visual hierarchy.

---

## 2. Fixed Technology Stack

### Backend
- **Language**: Go 1.26
- **Web Framework**: Gin
- **ORM / Concurrency**: GORM with row-level locking (`SELECT ... FOR UPDATE`) preventing double bookings
- **Authentication**: JWT (HS256) with role-based access control (RBAC) middleware
- **Real-Time Communication**: Gorilla WebSocket Hub for instantaneous operational broadcasts
- **Database**: PostgreSQL 17
- **Caching**: Redis 7

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 with custom luxury hospitality tokens
- **Data Fetching & Cache**: TanStack Query (React Query)
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Data Visualization**: Recharts

---

## 3. System Architecture & Port Map

| Component | Port | Description |
| :--- | :--- | :--- |
| **Frontend Web Client** | `3000` (or `5174`) | React/Vite Single Page Application |
| **Backend REST API** | `8095` | Go Gin RESTful API & WebSocket Hub |
| **PostgreSQL Database** | `5435` | Containerized PostgreSQL 17 Alpine |
| **Redis Cache** | `6385` | Containerized Redis 7 Alpine |

---

## 4. Default Demo Credentials

Pre-configured role accounts in the seed database:

| Role | Username | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin123` | Full access across all 17 operational modules & settings |
| **Hotel Manager** | `manager` | `manager123` | Operational oversight, staff management, approvals |
| **Receptionist** | `reception` | `reception123` | Front Desk, Check-Ins, Check-Outs, Calendar, Bookings |
| **Accountant** | `accountant` | `account123` | Folios, Invoices, Payment collection, Night Audit reports |
| **Housekeeping** | `housekeeping` | `clean123` | Housekeeping turnover kanban, cleaning checklists |
| **Restaurant Staff** | `restaurant` | `dine123` | Restaurant POS, Table orders, Direct-to-Room Folio charge |

---

## 5. Core Operational Modules

### MODULE A — Executive Dashboard
- **Key Performance Indicators**: Total Rooms (40), Available, Occupied, Reserved, Dirty, Maintenance, Check-Ins Today, Check-Outs Today, Current In-House Guests.
- **Financial Telemetry**: Today's Revenue, Monthly Revenue, Outstanding Folio Balances.
- **Hospitality Metrics**: Occupancy Rate (%), Average Daily Rate (ADR = Room Revenue / Rooms Sold), RevPAR (Room Revenue / Total Sellable Rooms).
- **Visual Analytics**: 7-day revenue trend area chart and reservation source mix donut chart.
- **Manifests**: Upcoming Arrivals, Upcoming Departures, and Recent Reservations.

### MODULE B & C — Reservations & Interactive Booking Calendar
- **Double-Booking Concurrency Protection**: Database transaction locks (`FOR UPDATE`) check overlapping dates (`check_in_date < res.CheckOutDate AND check_out_date > res.CheckInDate`) and enforce strict availability.
- **Rate Plan Pricing**: Automatic base rate calculations with meal plan markups (Bed & Breakfast, Half Board) and corporate discount agreements.
- **Timeline Grid**: 14-day interactive visual room timeline with color-coded status blocks and booking detail popovers.
- **Printable Vouchers**: Official guest booking confirmations with itemized tax and VAT breakdown.

### MODULE D — Rooms & Property Management
- Floor-by-floor filtering (1st Floor Garden, 2nd Floor Suites, 3rd Floor Executive, 4th Floor Penthouse).
- 5 Luxury Categories: Deluxe King, Superior Twin, Executive Club Suite, Accessible Queen, Grand Presidential Suite.
- Live room statuses: *Available*, *Reserved*, *Occupied*, *Dirty*, *Cleaning*, *Inspected*, *Maintenance*, *Out of Order*.
- Instant status overrides (e.g. marking room into Maintenance for engineering).

### MODULE E — Front Desk Operations
- **Arrivals Manifest**: Quick check-in modal with room assignment, key card issuance, deposit recording, and automated folio activation.
- **Departures Manifest**: One-click checkout with folio balance verification, payment collection, and automatic turnover task generation.
- **Room Relocation**: Seamless in-house room transfer releasing the previous room as *Dirty* and occupying the new room.

### MODULE F — Guest CRM
- Profiles with VIP tier classifications (*Platinum*, *Gold*, *Silver*, *None*).
- Corporate affiliations (e.g. UNICEF, Apex Technologies, BEXIMCO, Square).
- Comprehensive stay history and lifetime spend tracking in BDT.

### MODULE G — Housekeeping Workflow
- 4-Stage Kanban: **Dirty (Turnover) → Cleaning → Supervisor Inspection → Clean & Available**.
- Interactive cleaning checklists (bed linens, bathroom sanitation, minibar replenishment, vacuuming).
- **Status Synchronization**: Approving a room immediately clears it into Front Desk available inventory.

### MODULE H — Restaurant & POS
- Floor plan table management (Indoor, Terrace, Patio, Private Dining).
- Curated food & beverage menu: Gourmet Appetizers, Signature Steaks, Heritage Bengali Specialties, Artisan Beverages, Desserts.
- Order channels: Dine-In, Takeaway, Room Service.
- **Charge to Room Folio**: One-click transfer of restaurant checks directly onto in-house guest folios.

### MODULE I — Billing & Finance
- Guest folios with real-time balance calculations.
- Multi-channel payment recording: Cash, Credit/Debit Card, bKash Merchant Pay, Nagad, Bank Wire.
- Printable official Mushak-6.3 Tax Invoices with 15% VAT and 10% Service Charge.

### MODULE J & K — Inventory & Procurement
- Multi-department product catalog: Linens, Amenities, Housekeeping chemicals, F&B provisions.
- Low-stock threshold alerts and consumption/adjustment tracking.
- Vendor purchase orders with approval workflows.

### MODULE L, M, N, O, R — Facilities, HR & Administration
- **Maintenance**: Equipment work orders with automatic room blocking.
- **Employees**: Staff directory, payroll records, and shift schedules.
- **Revenue**: ADR and RevPAR formula breakdown and rate plan matrices.
- **Reports**: Printable Daily Business Night Audit reports.
- **Settings & Audit**: Hotel profile, statutory tax configuration (15% VAT, 10% Svc), and tamper-evident security audit trail.

---

## 6. Verification & Automated Testing

The Go backend includes comprehensive automated integration tests covering the complete guest lifecycle:
```bash
cd backend
go test -v ./tests
```
**Tests executed:**
1. `TestAuth_LoginSuccessAndFailure`: Validates JWT token generation and rejection of invalid credentials.
2. `TestDoubleBookingPrevention`: Attempts concurrent overlapping bookings for the same room; asserts strict `409 Conflict` rejection.
3. `TestCompleteOperationalWorkflow`:
   - Creates a new guest reservation.
   - Executes Front Desk check-in; asserts room becomes `Occupied` and folio opens.
   - Places a Room Service restaurant order and charges it directly to the room folio.
   - Executes checkout; settles remaining balance.
   - Asserts room automatically transitions to `Dirty`.
   - Asserts a high-priority turnover task is automatically dispatched to Housekeeping.

---

## 7. Starting the Application

### 1. Start Infrastructure (PostgreSQL & Redis)
```bash
docker compose up -d
```

### 2. Run Backend
```bash
cd backend
go run ./cmd/api
# Or run precompiled binary:
.\hotelos-api.exe
```

### 3. Run Frontend
```bash
cd frontend
npm run dev
```
Open **`http://localhost:3000`** in your browser.
Log in with `admin` / `admin123`.

# Production safety

Production deployments must set `SEED_DEMO_DATA=false`; demo credentials must never be used outside development. On a clean database, configure the five `BOOTSTRAP_*` variables shown in `backend/.env.example`. The first hotel and Super Admin are created once, transactionally.

The backend enforces room-overlap, folio, payment, role, and state-transition rules in both application code and PostgreSQL. PostgreSQL must allow the `btree_gist` extension used by the room-allocation exclusion constraint.

For Vercel Services, keep the repository root as the project root and configure all backend variables in the project environment. The frontend uses same-origin `/api/v1` and authenticated `/ws` routes automatically.

