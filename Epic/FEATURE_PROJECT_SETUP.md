# FEATURE: Project Setup
**Epic:** #1
**Depends on:** None
**Status:** Pending

## User Story
Sebagai developer, saya ingin project Nuxt 4 terinisialisasi dengan semua dependencies dan konfigurasi yang benar, sehingga saya bisa mulai mengembangkan fitur aplikasi.

## Acceptance Criteria
- [ ] Project Nuxt 4 dengan TypeScript dapat dijalankan dengan `pnpm dev`
- [ ] Semua dependencies terinstall: @nuxt/ui, pinia, leaflet, @iconify/vue
- [ ] Folder structure sesuai AGENT.md terbentuk
- [ ] Environment variables terdefinisi di `.env.example`
- [ ] TailwindCSS + Nuxt UI berfungsi dengan dark theme
- [ ] ESLint + Prettier terkonfigurasi
- [ ] `pnpm lint` berjalan tanpa error
- [ ] Vitest terkonfigurasi dan bisa jalan
- [ ] `pnpm build` berhasil tanpa error

## Tasks
- [ ] Init Nuxt 4 project dengan `pnpm dlx nuxi@latest init`
- [ ] Install dependencies: `@nuxt/ui`, `pinia`, `@vueuse/core`, `leaflet`, `@types/leaflet`, `@iconify/vue`, `vitest`, `@vue/test-utils`, `playwright`
- [ ] Setup `nuxt.config.ts` dengan modul `@nuxt/ui`, pinia
- [ ] Setup TailwindCSS dark theme config (`app/assets/css/main.css`)
- [ ] Buat folder structure: layouts/, pages/, components/, composables/, services/, stores/, types/, assets/, public/, plugins/, utils/, middleware/
- [ ] Buat `.env.example` dengan variabel: NUXT_PUBLIC_API_BASE, NUXT_PUBLIC_APP_NAME, NUXT_PUBLIC_DEFAULT_LAT, NUXT_PUBLIC_DEFAULT_LON
- [ ] Setup `app.vue` dengan UApp wrapper
- [ ] Setup Vitest + @vue/test-utils + jsdom
- [ ] Setup ESLint flat config
- [ ] Setup Prettier config
- [ ] Verifikasi `pnpm dev`, `pnpm lint`, `pnpm build`, `pnpm test` work

## Components Touched
- app.vue

## Definition of Done (from AGENT.md)
- [ ] implementation finished
- [ ] typed
- [ ] documented
- [ ] follows folder structure
- [ ] follows technology constraints
- [ ] passes lint
- [ ] passes unit tests
- [ ] contains no hardcoded backend URL
- [ ] code reviewed

## Technical Notes
- Framework: Nuxt 4 (gunakan `nuxi@latest`)
- UI: @nuxt/ui v4 dengan TailwindCSS
- Jangan instal versi lama Nuxt UI; pastikan compat dengan Nuxt 4
- `.nuxt/` dan `node_modules/` sudah di `.gitignore` otomatis
- Leaflet CSS harus di-import manual di plugin atau nuxt.config
- Pastikan Tailwind v4 jika Nuxt UI v4 membutuhkannya
