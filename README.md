# 31st File ERP

A modern, high-performance web-based ERP system built for speed, compliance, and beautiful dark-mode aesthetics.

## Tech Stack
- **Frontend**: React, Vite, Wouter (Routing), Tailwind CSS (via components), React Query.
- **Backend**: Node.js, Express, Drizzle ORM, Zod, Postgres.
- **Monorepo**: pnpm workspaces.

## Features
- **Dashboard**: Real-time insights and P&L summaries.
- **Financial Accounts & Ledger**: Comprehensive double-entry accounting.
- **UPI Capture & CSV Imports**: Bulk import staging for rapid bank reconciliation.
- **Compliance Reports**: Automated GST Returns (GSTR-1, GSTR-2A/ITC, GSTR-3B) and TDS 26Q tracking.
- **Production Ready**: Fully dockerized backend and frontend with Nginx reverse proxy.

---

## Local Development Setup

1. **Install Dependencies**
   Ensure you have Node 20+ and `pnpm` installed.
   ```bash
   pnpm install
   ```

2. **Database Setup**
   Ensure a local PostgreSQL instance is running. 
   Create an `.env` file inside `lib/db` and `artifacts/api-server` (or at the root) containing:
   ```env
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/erp_db
   ```

3. **Run the Application**
   You can run the API and Frontend concurrently:
   ```bash
   pnpm run dev
   ```
   - The frontend will be available at `http://localhost:5173`
   - The API will be available at `http://localhost:3000`

---

## Production Deployment

This project uses Docker Compose for a streamlined production deployment.

1. **Configure Environment**
   Edit the `.env.production` file to set your secure database passwords and JWT secrets:
   ```env
   DB_USER=postgres
   DB_PASSWORD=your_secure_password
   DB_NAME=erp_db
   JWT_SECRET=your_production_secret
   ```

2. **Spin Up the Containers**
   Ensure Docker and Docker Compose are installed on your server, then run:
   ```bash
   docker compose --env-file .env.production up --build -d
   ```

3. **Access the App**
   The application will be served via Nginx on standard HTTP port `80`. Navigate to your server's IP address or domain name in your browser.

> **Note**: For HTTPS (SSL), you will need to map an SSL certificate to the Nginx container or put this setup behind an additional reverse proxy like Cloudflare, Traefik, or an AWS Application Load Balancer.
