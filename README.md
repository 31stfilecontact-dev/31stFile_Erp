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

---

## Single Button Deployment (GitHub Actions)

You can trigger a completely automated deployment to your Virtual Private Server (VPS) directly from GitHub using the **"Run workflow"** button.

### 1. Server Prerequisites
- Ensure your server has Docker and Docker Compose installed.
- Clone this repository into `/opt/31stFile_Erp` on your server.
- Create your `.env.production` file inside that directory.

### 2. Configure GitHub Secrets
Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**, and add the following:
- `SERVER_HOST`: The IP address of your VPS (e.g., `192.168.1.100`)
- `SERVER_USER`: Your SSH username (e.g., `root` or `ubuntu`)
- `SERVER_SSH_KEY`: Your private SSH key (e.g., the contents of `~/.ssh/id_rsa`)

### 3. Deploy
1. Go to the **Actions** tab in your GitHub repository.
2. Click on **Deploy to Production Server** in the left sidebar.
3. Click the **Run workflow** dropdown on the right.
4. Click the green **Run workflow** button!

GitHub will automatically SSH into your server, pull the latest code, and spin up the new Docker containers with zero downtime!

---

## 100% Free Hosting (PaaS)
If you don't have a server and want to host this for absolutely **$0/month**, use this modern distributed architecture:

### 1. Database (Neon.tech)
1. Go to [Neon.tech](https://neon.tech/) and create a free Serverless Postgres database.
2. Copy the `DATABASE_URL` they provide you.

### 2. Backend API (Render.com)
1. Go to [Render.com](https://render.com/), create an account, and click **New -> Blueprint**.
2. Connect your GitHub repository. Render will read the `render.yaml` file in this repository and automatically configure the Node.js API.
3. In the Render Dashboard, paste your Neon `DATABASE_URL` into the environment variables.
4. Copy the public URL Render gives you (e.g., `https://erp-api-xyz.onrender.com`).

### 3. Frontend (Vercel.com)
1. Edit the file `artifacts/erp/vercel.json` in this repository and replace `YOUR_RENDER_URL` with the actual URL Render gave you in Step 2. Commit and push this change to GitHub.
2. Go to [Vercel.com](https://vercel.com/) and click **Add New -> Project**.
3. Connect your GitHub repository.
4. **Important:** Change the "Root Directory" to `artifacts/erp`.
5. Click **Deploy**.

Your ERP is now live on the internet, with a free PostgreSQL database, a free Node.js API, and a free globally cached frontend!
