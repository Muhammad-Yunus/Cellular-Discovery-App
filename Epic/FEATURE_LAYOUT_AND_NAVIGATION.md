# FEATURE: Layout & Navigation
**Epic:** #4
**Depends on:** #3 Stores & Composables
**Status:** Pending

## User Story
Sebagai user, saya ingin melihat navigasi fixed di bagian atas dan layout dashboard yang konsisten, sehingga saya bisa bernavigasi ke semua halaman dengan mudah.

## Acceptance Criteria
- [ ] `layouts/default.vue` menyediakan struktur: Navbar (top) + Map area (full remaining) + floating elements
- [ ] Map area mengisi semua ruang di bawah navbar
- [ ] `AppNavbar.vue` menampilkan brand/logo dan 4 link navigasi: Home, Settings, Scan Result, About
- [ ] Navbar fixed/sticky di top
- [ ] Link navigasi aktif di-highlight sesuai halaman yang aktif
- [ ] Layout konsisten di semua halaman (desktop-first)
- [ ] Navbar meresponsive (tablet-friendly)
- [ ] Dark theme professional, industrial, minimal
- [ ] Icons menggunakan @iconify/vue (lucide set)
- [ ] Unit test layout rendering dan navigasi

## Tasks
- [ ] Buat `layouts/default.vue` dengan struktur div grid/flex:
  - Navbar area (fixed top)
  - Main container (flex: sidebar + map area)
  - <slot /> untuk injection halaman
- [ ] Buat `components/AppNavbar.vue`:
  - Logo/app name dari env `NUXT_PUBLIC_APP_NAME`
  - Navigation links dengan NuxtLink
  - Active link highlighting
  - Sticky positioning
  - Dark theme Tailwind classes
- [ ] Setup routing dengan halaman placeholder: index.vue, settings.vue, history.vue, about.vue
- [ ] Setup Nuxt UI UApp wrapper di app.vue
- [ ] Setup Tailwind dark theme (default dark, tanpa toggle)
- [ ] Unit test AppNavbar: renders all links, active state

## Components Touched
- layouts/default.vue
- components/AppNavbar.vue
- app.vue

## Definition of Done (from AGENT.md)
- [ ] implementation finished
- [ ] typed
- [ ] documented
- [ ] reusable
- [ ] responsive
- [ ] follows folder structure
- [ ] follows technology constraints
- [ ] follows component architecture
- [ ] passes lint
- [ ] passes unit tests
- [ ] contains no duplicated logic
- [ ] code reviewed

## Technical Notes
- Layout: Tailwind `h-screen` + `flex flex-col` + `flex-1` untuk map area
- Navbar: `sticky top-0 z-50` dengan background dark solid
- Nav links: `text-default` dengan `text-primary` untuk active state
- Link Scan Result path: `/history`
- Gunakan Nuxt UI `UNavigationMenu` atau custom dengan NuxtLink
- Pastikan layout tidak menginterferensi floating sidebar/bottom panel (z-index stack)
