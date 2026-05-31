# Stockwise — Inventory Tracker

A full-stack inventory management system built with **React + TypeScript** (frontend) and **Node.js / Express + TypeScript** (backend), designed as a production-quality CRUD application.

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **React Router v6** — client-side routing
- **React Hook Form** + **Zod** — form handling & validation
- **Axios** — HTTP client with interceptors
- **Tailwind CSS** — utility-first styling
- **Lucide React** — icon library
- **date-fns** — date formatting

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Better-SQLite3** — embedded SQLite database (zero-config, NestJS-ready to swap in)
- **UUID** — unique ID generation
- RESTful API with full CRUD

> **Note:** The backend architecture mirrors NestJS patterns (modules → routes, services, DTOs/types) and is designed to be easily migrated to NestJS by extracting controllers, services, and modules.

---

## Features

- **Dashboard** — live stats, stock trend charts (30-day in/out), low stock alerts, recent movements
- **Products** — full CRUD with search, filters, pagination, **CSV import/export**
- **Categories** — manage product groupings
- **Stock Log** — record stock IN / OUT / adjustment movements with notes; full history
- **Auth** — login, forgot password, email reset link
- **Docker** — run full stack with `docker compose up`

---

## Project Structure

```
inventory-tracker/
├── backend/
│   ├── src/
│   │   ├── main.ts              # Express app entry
│   │   ├── database.ts          # SQLite setup + seed data
│   │   ├── types.ts             # Shared interfaces & DTOs
│   │   └── routes/
│   │       ├── products.ts      # GET/POST/PATCH/DELETE /products
│   │       ├── categories.ts    # GET/POST/PATCH/DELETE /categories
│   │       └── movements.ts     # GET/POST /movements
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx             # Entry point
│   │   ├── App.tsx              # Router + layout
│   │   ├── index.css            # Tailwind + custom tokens
│   │   ├── types/index.ts       # TypeScript interfaces
│   │   ├── services/api.ts      # Axios service layer
│   │   ├── hooks/useData.ts     # Custom data-fetching hooks
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── StockMovementForm.tsx
│   │   │   └── ui/index.tsx     # Reusable UI components
│   │   └── pages/
│   │       ├── Dashboard.tsx
│   │       ├── Products.tsx
│   │       ├── Categories.tsx
│   │       └── Movements.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── data/                        # SQLite DB (auto-created, gitignored)
├── package.json                 # Root monorepo scripts
└── README.md
```

---

## API Endpoints

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (pagination, search, filters) |
| GET | `/api/products/stats` | Dashboard statistics |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product |
| PATCH | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create category |
| PATCH | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Stock Movements
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/movements` | List movements (paginated) |
| POST | `/api/movements` | Record movement (in/out/adjustment) |

### Query Parameters (Products)
- `page`, `limit` — pagination
- `search` — search name, SKU, description
- `category_id` — filter by category
- `status` — filter by active/inactive/discontinued
- `low_stock=true` — only show items at or below min quantity

---

## Getting Started

### Prerequisites
- **Node.js 20 LTS** (required — `better-sqlite3` native module; use `nvm use` if you have `.nvmrc`)
- npm 8+

### Install & Run

```bash
# Clone the repo
git clone https://github.com/yourusername/inventory-tracker.git
cd inventory-tracker

# Use Node 20 (if using nvm)
nvm use

# Install all dependencies
npm run install:all

# Run both frontend and backend concurrently
npm run dev
```

Or run separately:

```bash
# Terminal 1 — Backend (http://localhost:3001)
cd backend
npm install
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

The database is created automatically at `data/inventory.db` with seed data on first run.

---

## Docker

Run the full stack with Docker Compose (no Node.js install required):

```bash
# Build and start (frontend on :80, backend on :3001)
docker compose up --build -d

# Or use npm script
npm run docker:up
```

Open **http://localhost** — login with `admin@stockwise.com` / `admin123`.

```bash
# View logs
npm run docker:logs

# Stop containers
npm run docker:down
```

Optional: copy `.env.example` to `.env` and set `JWT_SECRET`, SMTP settings, etc. Docker Compose reads `.env` automatically.

SQLite data persists in the `inventory-data` Docker volume.

---

## Design Decisions

- **SQLite over PostgreSQL** — zero-config for local dev; trivial to swap using TypeORM/Prisma for production
- **Express over NestJS** — keeps dependencies minimal; architecture follows NestJS conventions for easy migration
- **React Hook Form + Zod** — best-practice form validation with TypeScript-first schema
- **Custom hooks** — `useProducts`, `useCategories`, `useMovements` encapsulate fetching logic cleanly
- **Vite proxy** — eliminates CORS issues in development

---
