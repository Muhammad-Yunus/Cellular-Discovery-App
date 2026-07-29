# LTE Scanner

> USB Modem LTE Network Discovery Web Frontend

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4-00DC82?style=for-the-badge&logo=nuxt&logoColor=white)](https://nuxt.com)
[![Vue 3](https://img.shields.io/badge/Vue-3-42B88C?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Pinia](https://img.shields.io/badge/Pinia-3.x-FCD34D?style=for-the-badge&logo=pinia&logoColor=black)](https://pinia.vuejs.org)

[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)
[![Vitest](https://img.shields.io/badge/Vitest-Unit-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)
[![pnpm](https://img.shields.io/badge/pnpm-11.x-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io)

[![Tests](https://github.com/Muhammad-Yunus/Cellular-Discovery-App/actions/workflows/test.yml/badge.svg)](https://github.com/Muhammad-Yunus/Cellular-Discovery-App/actions/workflows/test.yml)
[![Lint & Typecheck](https://github.com/Muhammad-Yunus/Cellular-Discovery-App/actions/workflows/test.yml/badge.svg?job=unit)](https://github.com/Muhammad-Yunus/Cellular-Discovery-App/actions/workflows/test.yml)
[![License](https://img.shields.io/github/license/Muhammad-Yunus/Cellular-Discovery-App?style=flat-square)](LICENSE)

## Project Overview

LTE Scanner is a modern web application for discovering and monitoring LTE network information via USB modems on Linux systems. It provides a real-time interface to scan LTE devices, monitor signal strength, view cell tower details, and manage system health. Built with Nuxt 4 and Vue 3, it features a custom toast notification system, WebSocket-based live updates, and end-to-end testing with Playwright.

## Features

- **LTE Device Scanning**: Discover and list connected USB LTE modems
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
|  +-----------+     +-----------+     +-------------+             |
|  |  Nuxt App | --> |  Nitro    | --> |   Browser   |             |
|  |  (SSR)    |     |  Server   |     |   (ARM64)   |             |
|  +-----+-----+     +-----------+     +-------------+             |
|        |                                                       |
|        v                                                       |
|  +----------------------------------------------------------+   |
|  |                  Application State                       |   |
|  |                                                          |   |
|  |  +----------+   +-----------+   +--------------+          |   |
|  |  | scanStore|   |systemStore|   |settingsStore |          |   |
|  |  +----+-----+   +-----+-----+   +------+-------+          |   |
|  |       |               |                |                  |   |
|  |       v               v                v                  |   |
|  |  +----------+   +-----------+   +--------------+          |   |
|  |  | useScan  |   | useSystem |   | useSettings  |          |   |
|  |  +----+-----+   +-----+-----+   +------+-------+          |   |
|  |       |               |                |                  |   |
|  |       +-------+-------+--------+-------+                  |   |
|  |               |                |                          |   |
|  |               v                v                          |   |
|  |        +-------------+   +-------------+                  |   |
|  |        | CustomToaster|  |   UApp/UIcon |                 |   |
|  |        +-------------+   +-------------+                  |   |
|  +----------------------------------------------------------+   |
|        |                                                       |
|        v                                                       |
|   Backend API (REST + WebSocket) <------------------------------+
|                                                                 |
|  +----------------------------------------------------------+   |
|  |              Backend Service (FastAPI / Flask)           |   |
|  |                                                          |   |
|  |   +---------------+         +---------------+             |   |
|  |   |  USB Modem    |         |   Signal      |             |   |
|  |   |  Scanner      |         |   Decoder     |             |   |
|  |   +-------+-------+         +-------+-------+             |   |
|  |           |                         |                     |   |
|  |           v                         v                     |   |
|  |   +---------------+         +---------------+             |   |
|  |   | CLI Wrapper   |         |   Database    |             |   |
|  |   | (lsusb, mmcli)|        |   (SQLite)    |             |   |
|  |   +---------------+         +---------------+             |   |
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

## Technology Stack

- **Frontend**: Nuxt 4, Vue 3.5+, TypeScript 5.x, Pinia 3
- **Backend Integration**: @nuxt/ui v4, Tailwind CSS 4
- **HTTP Client**: $fetch (ofetch), WebSocket (custom reconnecting implementation)
- **Mapping**: Leaflet.js 1.9, @types/leaflet
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

## Known Issues & Workarounds

| Issue                                             | Status             | Solution                                                                                  |
|---------------------------------------------------|--------------------|-------------------------------------------------------------------------------------------|
| `ce` property crash during SSR on initial load    | **FIXED**          | Removed `@nuxt/ui` toaster from `App.vue`; added `toaster="null"` prop; toast in `CustomToaster` (client-only) |
| Toast not rendering / hydration error             | **FIXED**          | `CustomToaster` wrapped in `<ClientOnly>`; Vue-native ref-based state instead of `useToast()` |
| Multiple toast notifications stacking             | Working            | Custom toasts auto-dismiss after delay; removed duplicate `setTimeout` cleanup issue      |
| Slow build/startup on ARM64                       | **PERFORMANCE**    | Larger node_modules; consider Docker with arm64 image for consistency                     |
| Playwright test stability on ARM64                | **WORKING**        | Slower Chromium launch on Pi; increased timeout to 60s; single worker mode enabled       |
| System panel "Backend is not responding" on /api/v1 | **FIXED**          | Health probe decoupled to `NUXT_PUBLIC_HEALTH_BASE` (`/health` at backend root)           |

## Roadmap

- [x] Fix SSR toast crash
- [x] Implement custom toast component
- [x] Migrate all toast usage to custom system
- [x] Decouple health probe from versioned apiBase
- [ ] Add toast persistence/local storage
- [ ] Improve map visualization performance on ARM
- [ ] Add dark/light theme toggle
- [ ] Implement user authentication
- [ ] Export scan data as CSV/PDF
- [ ] Add mobile-responsive layout enhancements

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`feat/your-feature-name`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feat/your-feature-name`)
5. Open a Pull Request

Please ensure your code passes linting (`pnpm lint`) and type checking (`pnpm typecheck`).

---

*Built with care on Raspberry Pi ARM64*
