# LTE Scanner 🔍

**USB Modem LTE Network Discovery Web Frontend**

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4-blue?style=logo=nuxtjs)](https://nuxt.com) [![Vue 3](https://img.shields.io/badge/Vue-3-42B88C?style=logo=vuejs)](https://vuejs.org) [![Playwright](https://img.shields.io/badge/Playwright-Test-%236DDCFA?style=logo=playwright)](https://playwright.dev) [![pnpm](https://img.shields.io/badge/pnpm-66CCFF?style=logo=pnpm)](https://pnpm.io/)

[![Build Status](https://github.com/sapiensai/cellular-discovery-app/actions/workflows/test.yml/badge.svg)](https://github.com/sapiensai/cellular-discovery-app/actions)
[![License](https://img.shields.io/github/license/sapiensai/cellular-discovery-app)](LICENSE)

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

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Client Side)                  │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Nuxt App   │───▶│  Playwright  │───▶│   Browser    │  │
│  │  (SSR/CSR)   │    │   E2E Tests  │    │   (ARM64)    │  │
│  └───────┬──────┘    └──────────────┘    └──────────────┘  │
│          │                                                   │
│          ▼                                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Application State                       │    │
│  │  ┌─────────┐   ┌─────────┐   ┌─────────┐            │    │
│  │  │scanStore│   │systemStore│ │settingsStore│           │    │
│  │  └────┬────┘   └────┬────┘   └────┬─────┘            │    │
│  │         │            │              │                 │    │
│  │         ▼            ▼              ▼                 │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │    │
│  │  │useScan()    │ │useSystem()  │ │useSettings()│   │    │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │    │
│  │         │              │              │           │    │
│  │   ┌─────┴─────┐ ┌──────┴──────┐ ┌──────┴──────┐   │    │
│  │   │CustomToaster│ │  UIcon     │ │  UApp      │   │    │
│  │   └───────────┘ └──────────────┘ └──────────────┘   │    │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Backend API (WebSocket + REST) ◄────────────────────────────┘
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │   Backend Service (Node.js / Express / Fastify)     │    │
│  │   ┌──────────────┐   ┌──────────────┐                │    │
│  │   │USB Modem    │   │  Signal      │                │    │
│  │   │Scanner      │   │  Decoder     │                │    │
│  │   └──────┬──────┘   └──────┬───────┘                │    │
│  │          │                │                         │    │
│  │   ┌──────▼──────┐    ┌────▼────────┐               │    │
│  │   │CLI Wrapper  │    │  Database   │               │    │
│  │   │(lsusb, mm) │    │  (SQLite)   │               │    │
│  │   └────────────┘    └─────────────┘               │    │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Stack Components

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Nuxt 4 | Full-stack Vue framework |
| **UI Library** | @nuxt/ui (Uno CSS based) | Prebuilt UI components |
| **State Management** | Pinia | Reactive stores for scanning, system, settings |
| **HTTP/WebSocket** | Axios + custom ReconnectingWebSocket | API calls & live updates |
| **Testing** | Playwright + Vitest | E2E & unit tests |
| **Build Tool** | Vite / pnpm | Fast bundling & package management |
| **Styling** | Tailwind CSS / UnoCSS | Utility-first styling |
| **Icons** | iconify | Lucide & Simple Icons collections |
| **Maps** | Leaflet | Visual map display for cell towers |
| **Layout** | NuxtLayout + NuxtPage | Router integration |

## Technology Stack

- **Frontend**: Nuxt 4, Vue 3.5+, TypeScript 5.x, Pinia
- **Backend Integration**: @nuxt/ui v4, Uno CSS
- **HTTP Client**: Axios, WebSocket (custom reconnecting implementation)
- **Mapping**: Leaflet.js (19.x), @types/leaflet
- **Icons**: Iconify with Lucide and Simple Icons JSON packs
- **Tooling**: pnpm 11+, Node.js 24+, Vite 7, Nitro 2
- **Testing**: Playwright 1.52+, Vitest, ESLint, TypeScript compiler

## Project Structure

```
cellular-discovery-app/
├── app/                  # Application source code
│   ├── composable/       # Reusable logic hooks
│   │   ├── useScan.ts        # Scan-related state & WS
│   │   ├── useSystem.ts      # System health monitoring
│   │   └── useSettings.ts    # Settings management
│   ├── components/       # Vue components
│   │   ├── CustomToaster.vue # Custom toast UI (client-only)
│   │   └── ... other components
│   ├── stores/           # Pinia stores
│   │   ├── scanStore.ts
│   │   ├── systemStore.ts
│   │   └── settingsStore.ts
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
│       └── websocket.ts    # ReconnectingWebSocket class
├── tests/
│   └── e2e/              # Playwright end-to-end tests
│       ├── home.spec.ts
│       ├── scanning.spec.ts
│       ├── health.spec.ts
│       ├── history.spec.ts
│       ├── settings.spec.ts
│       ├── bottom-panel.spec.ts
│       ├── sidebar.spec.ts
│       └── about.spec.ts
├── public/               # Static assets
├── .eslintrc             # ESLint config
├── playwright.config.ts  # Playwright configuration
├── nuxt.config.ts        # Nuxt configuration
├── package.json          # Project scripts & dependencies
├── tsconfig.json         # TypeScript config
└── README.md             # This file
```

## How to Build & Run

### Prerequisites

- **OS**: Linux (64-bit), specifically tested on Raspbian ARM64
- **Node.js**: v24.x or later (via nvm recommended)
- **Package Manager**: pnpm 11+

### Installation

```bash
# Clone repository
git clone https://github.com/sapiensai/cellular-discovery-app.git
cd cellular-discovery-app

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
# API base URL (used by frontend to connect to backend API)
API_BASE_URL=http://localhost:3001

# WebSocket endpoint for scan events
WS_ENDPOINT=wss://localhost:3001/ws/scan

# Timeout settings (in milliseconds)
SCAN_TIMEOUT=30000
HEALTH_CHECK_INTERVAL=5000
```

## Known Issues & Workarounds

| Issue | Status | Solution |
|-------|--------|----------|
| `ce` property crash during SSR on initial load | ✅ **FIXED** | Removed `@nuxt/ui` toaster from `App.vue`; added `toaster="null"` prop; moved toast system to `CustomToaster` (client-only) |
| Toast not rendering / hydration error | ✅ **FIXED** | `CustomToaster` wrapped in `<ClientOnly>`; uses Vue-native ref-based state instead of `useToast()` |
| Multiple toast notifications stacking | ✅ Working | Custom toasts auto-dismiss after delay; removed duplicate `setTimeout` cleanup issue |
| Slow build/startup on ARM64 | ⚠️ **PERFORMANCE** | Larger node_modules; consider using Docker with arm64 image for consistency |
| Playwright test stability on ARM64 | ⚠️ **WORKING** | Slower Chromium launch on Pi; increased timeout to 60s; single worker mode enabled |

## Roadmap

- [x] Fix SSR toast crash (completed)
- [x] Implement custom toast component (completed)
- [x] Migrate all toast usage to custom system (completed)
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

**Built with ❤️ on Raspberry Pi ARM64** 🇮🇩
