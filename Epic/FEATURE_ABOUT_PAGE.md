# FEATURE: About Page
**Epic:** #14
**Depends on:** #4 Layout & Navigation
**Status:** Pending

## User Story
Sebagai user, saya ingin melihat halaman about yang menjelaskan aplikasi, sehingga saya tahu tujuan dan teknologi yang digunakan.

## Acceptance Criteria
- [ ] `pages/about.vue` menampilkan informasi aplikasi
- [ ] Menampilkan nama aplikasi dari env `NUXT_PUBLIC_APP_NAME`
- [ ] Menampilkan deskripsi: "USB Modem LTE Network Discovery Web Frontend"
- [ ] Menampilkan teknologi stack: Nuxt 4, Vue 3, TypeScript, Vite, Pinia, TailwindCSS, Leaflet
- [ ] Menampilkan informasi backend API version (optional — dari health check)
- [ ] Layout konsisten dengan tema dark aplikasi
- [ ] Responsive
- [ ] Unit test: render halaman

## Tasks
- [ ] Buat `pages/about.vue`:
  - App name + description
  - Technology stack list
  - Version info (optional)
  - Dark theme styling
- [ ] Integrasi dengan layout default (navbar + basic tanpa map)
- [ ] Minimal styling yang konsisten dengan tema aplikasi
- [ ] Unit test: halaman render correct content

## Components Touched
- pages/about.vue

## Definition of Done (from AGENT.md)
- [ ] implementation finished
- [ ] typed
- [ ] documented
- [ ] responsive
- [ ] follows folder structure
- [ ] follows technology constraints
- [ ] passes lint
- [ ] passes unit tests
- [ ] code reviewed

## Technical Notes
- Halaman statis, tidak perlu API calls
- Layout: default layout dengan navbar, tanpa map (sidebar/map tidak muncul di halaman ini)
- Style: Tailwind dark theme, card-like layout dengan UCard atau div styling
- Informasi bisa dimasukkan sebagai static data di halaman
- Tambahkan GitHub link atau dokumentasi jika diperlukan (future)
