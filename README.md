# Cellular Discovery

> Cellular Network Discovery Web Frontend

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4-00DC82?style=for-the-badge&logo=nuxt&logoColor=white)](https://nuxt.com)
[![Vue 3](https://img.shields.io/badge/Vue-3-42B88C?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Pinia](https://img.shields.io/badge/Pinia-3.x-FCD34D?style=for-the-badge&logo=pinia&logoColor=black)](https://pinia.vuejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)
[![Vitest](https://img.shields.io/badge/Vitest-Unit-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)
[![pnpm](https://img.shields.io/badge/pnpm-11.x-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io)

## Project Overview

Cellular Discovery is a modern web application for discovering and monitoring LTE, UMTS, and GSM network information via USB modems on Linux systems. It provides a real-time interface to scan these networks, monitor signal strength, view cell tower details, and manage system health. Built with Nuxt 4 and Vue 3, it features a custom toast notification system, WebSocket-based live updates, and end-to-end testing with Playwright.

## Features

- **LTE/UMTS/GSM Device Scanning**: Discover and list connected USB modems
- **Signal Monitoring**: Real-time RSSI, RSRP, SINR metrics (via backend connection)
- **Cell Tower Details**: View PLMN, TAC, PCI, frequency, band information
- **System Health Monitor**: Track backend service status and response time
- **Search & Filter**: Quick search and filter scans by ID/status
- **Toast Notifications**: Custom toast system with proper client-side rendering
- **WebSocket Live Updates**: Real-time scan completion notifications
- **End-to-End Testing**: Playwright tests with video capture on failure

## Architecture

```text
+-----------------------------------------------------------------+
|                   Frontend (Nuxt 4 + Vue 3)                     |
|                                                                 |
|  +-----------+     +-----------+     +-------------+            |
|  |  Nuxt App | --> |  Nitro    | --> |   Browser   |            |
|  |  (SSR)    |     |  Server   |     |             |
|  +-----+-----+     +-----------+     +-------------+            |
|        |                                                        |
|        v                                                        |
|  +----------------------------------------------------------+   |
|  |                  Application State                       |   |
|  |                                                          |   |
|  |  +----------+   +-----------+   +--------------+         |   |
|  |  | scanStore|   |systemStore|   |settingsStore |         |   |
|  |  +----+-----+   +-----+-----+   +------+-------+         |   |
|  |       |               |                |                 |   |
|  |       v               v                v                 |   |
|  |  +----------+   +-----------+   +--------------+         |   |
|  |  | useScan  |   | useSystem |   | useSettings  |         |   |
|  |  +----+-----+   +-----+-----+   +------+-------+         |   |
|  |       |               |                |                 |   |
|  |       +-------+-------+--------+-------+                 |   |
|  |               |                |                         |   |
|  |               v                v                         |   |
|  |        +-------------+   +-------------+                 |   |
|  |        |CustomToaster|   |  UApp/UIcon |                 |   |
|  |        +-------------+   +-------------+                 |   |
|  +----------------------------------------------------------+   |
|                           |                                     |
|                           v                                     |
|           Backend API (REST + WebSocket)                        |
|  +----------------------------------------------------------+   |
|  |         Backend Service (FastAPI / Flask)                |   |
|  |                                                          |   |
|  |     +---------------+         +---------------+          |   |
|  |     |  USB Modem    |         |   Signal      |          |   |
|  |     |  Scanner      |         |   Decoder     |          |   |
|  |     +-------+-------+         +-------+-------+          |   |
|  |             |                         |                  |   |
|  |             v                         v                  |   |
|  |     +---------------+         +---------------+          |   |
|  |     | CLI Wrapper   |         |   Database    |          |   |
|  |     | (lsusb, mmcli)|         |    (PSQL)     |          |   |
|  |     +---------------+         +---------------+          |   |
|  +----------------------------------------------------------+   |
+-----------------------------------------------------------------+
```

### Stack Components

| Layer            | Technology                          | Purpose                              |
|------------------|-------------------------------------|--------------------------------------|
| **Framework**    | Nuxt 4                              | Full-stack Vue framework             |
| **UI Library**   | @nuxt/ui v4                         | Prebuilt UI components               |
| **State**        | Pinia 3                             | Reactive stores (scan, system, etc.) |
| **HTTP / WS**    | $fetch + custom ReconnectingWebSocket | API calls & live updates           |
| **Testing**      | Playwright + Vitest                 | E2E & unit tests                     |
| **Build Tool**   | Vite 7 / pnpm 11                    | Fast bundling & package management   |
| **Styling**      | Tailwind CSS 4                      | Utility-first styling                |
| **Icons**        | Iconify (Lucide, Simple Icons)      | Icon collections                     |
| **Maps**         | Leaflet 1.9                         | Visual map display for cell towers   |
| **Layout**       | NuxtLayout + NuxtPage               | Router integration                   |

## Technologies

- **Frontend**: Nuxt 4, Vue 3.5+, TypeScript 5.x, Pinia 3
- **Integration**: @nuxt/ui v4, Tailwind CSS 4
- **HTTP**: $fetch (ofetch), WebSocket (custom reconnecting implementation)
- **Maps**: Leaflet.js 1.9, @types/leaflet
- **Icons**: Iconify with Lucide and Simple Icons JSON packs
- **Tooling**: pnpm 11+, Node.js 24+, Vite 7, Nitro 2
- **Testing**: Playwright 1.52+, Vitest 3, ESLint, TypeScript compiler

## Project Structure

```text
cellular-discovery-app/
+-- app/                    # Application source code
|   +-- composables/        # Reusable logic hooks
|   |   +-- useScan.ts          # Scan-related state & WS
|   |   +-- useSystem.ts        # System health monitoring
|   |   +-- useSettings.ts      # Settings management
|   +-- components/         # Vue components
|   |   +-- CustomToaster.vue   # Custom toast UI (client-only)
|   |   +-- ... other components
|   +-- stores/             # Pinia stores
|   |   +-- scanStore.ts
|   |   +-- systemStore.ts
|   |   +-- settingsStore.ts
|   +-- services/           # API client services
|   +-- types/              # TypeScript type definitions
|   +-- utils/              # Utility functions
|       +-- websocket.ts        # ReconnectingWebSocket class
+-- tests/
|   +-- e2e/                # Playwright end-to-end tests
|       +-- home.spec.ts
|       +-- scanning.spec.ts
|       +-- health.spec.ts
|       +-- history.spec.ts
|       +-- settings.spec.ts
|       +-- bottom-panel.spec.ts
|       +-- sidebar.spec.ts
|       +-- about.spec.ts
+-- public/                 # Static assets
+-- .github/workflows/      # CI workflows
+-- .eslintrc               # ESLint config
+-- playwright.config.ts    # Playwright configuration
+-- nuxt.config.ts          # Nuxt configuration
+-- package.json            # Project scripts & dependencies
+-- tsconfig.json           # TypeScript config
+-- README.md               # This file
```

## How to Build & Run

### Prerequisites

- **OS**: Linux (64-bit), specifically tested on Raspbian ARM64
- **Node.js**: v24.x or later (via nvm recommended)
- **Package Manager**: pnpm 11+

### Installation

```bash
# Clone repository
git clone https://github.com/Muhammad-Yunus/Cellular-Discovery-App.git
cd Cellular-Discovery-App

# Install dependencies
pnpm install

# Prepare the project (generates TypeScript types)
pnpm prepare
```

### Development Server

```bash
# Start Nuxt dev server on port 3000
pnpm dev

# Access at http://localhost:3000 or http://<your-ip>:3000
```

### End-to-End Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm playwright test tests/e2e/home.spec.ts

# Watch mode (if supported)
pnpm test:e2e --watch
```

### Linting & Type Checking

```bash
# Check code style
pnpm lint

# Check TypeScript types
pnpm typecheck
```

### Production Preview

```bash
# Build for production
pnpm build

# Serve locally
pnpm preview
```

### Production Deployment (systemd + nginx)

For production deployment on Linux servers, use systemd service with nginx as reverse proxy.

#### 1. Build for Production

```bash
# Build the Nuxt application
pnpm build

# The output will be in .output/ directory
ls .output/
```

#### 2. Create Systemd Service

Create a systemd service file at `/etc/systemd/system/cellular-discovery-app.service`:

```ini
[Unit]
Description=Cellular Discovery Web Application
After=network.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/home/pi/production-app/Cellular-Discovery-App/.output
ExecStart=/home/pi/.nvm/versions/node/v24.18.0/bin/node server/index.mjs
Restart=always
RestartSec=10

# Environment variables (optional)
Environment=NUXT_PUBLIC_API_BASE=http://192.168.1.108:8000/api/v1
Environment=NUXT_PUBLIC_HEALTH_BASE=http://192.168.1.108:8000

[Install]
WantedBy=multi-user.target
```

#### 3. Enable and Start the Service

```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable cellular-discovery-app

# Start the service
sudo systemctl start cellular-discovery-app

# Check status
sudo systemctl status cellular-discovery-app

# View logs
sudo journalctl -u cellular-discovery-app -f
```

#### 4. Configure nginx Reverse Proxy

Create nginx configuration at `/etc/nginx/sites-available/cellular-discovery-app`:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    location / {
        proxy_pass http://127.0.0.1:3000;  # Nuxt default port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 5. Enable nginx Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/cellular-discovery-app /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

#### 6. (Optional) Enable HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is handled by systemd timer
sudo systemctl status certbot.timer
```

#### 7. Verify Deployment

```bash
# Check service status
sudo systemctl status cellular-discovery-app

# Check nginx status
sudo systemctl status nginx

# Test from browser
curl -I http://localhost
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Main API base URL (versioned endpoint, e.g. /api/v1/scans)
NUXT_PUBLIC_API_BASE=http://192.168.1.108:8000/api/v1

# Health probe base URL (root path, e.g. /health)
NUXT_PUBLIC_HEALTH_BASE=http://192.168.1.108:8000

# App branding
NUXT_PUBLIC_APP_NAME=Cellular Discovery

# Default map center (Jakarta)
NUXT_PUBLIC_DEFAULT_LAT=-6.15067643667096
NUXT_PUBLIC_DEFAULT_LON=106.89665223346297
```

The health probe is intentionally separate from the main API base so the
backend can expose `/health` at the root while the versioned API lives
under `/api/v1`. See `app/services/api.ts` (`resolveHealthBaseURL`).

## API Client Usage

The frontend scan service (`app/services/scan.service.ts`) provides the `getScans()` function with the following parameters:

```ts
interface GetScansParams {
  page?: number          // Page number (default: 1)
  pageSize?: number      // Items per page (default: 10)
  search?: string        // Search term for filtering (optional)
  rat?: string           // Filter by RAT (e.g., 'LTE', 'NR'); if 'ALL' or empty, no filter applied
}
```

**Special Behavior for `rat` Parameter**: When `rat` is set to `'ALL'`, an empty string, or omitted entirely, it is not included in the query parameters, meaning no RAT-based filtering is performed on the backend. This allows users to view all scans regardless of Radio Access Technology.

### Usage Example

```ts
// Get first page of scans (all RATS, default pagination)
const scans = await useScan().getScans()

// Filter by specific RAT (e.g., only LTE scans)
const lteScans = await useScan().getScans({ rat: 'LTE' })

// Search and paginate
const results = await useScan().getScans({ 
  page: 2, 
  pageSize: 25, 
  search: 'Jakarta',
  rat: 'NR'   // Only show New Radio scans matching the search
})
```
---

*Built with care on Raspberry Pi ARM64*
