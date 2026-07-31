## CHANGES_SUMMARY.md

# Ringkasan Perubahan - Cellular Discovery App

## 1. Sort Icons di History Table (app/pages/history.vue)
**Kolom sortable**: Operator, MCC, MNC, RAT, Scan Time

| Type | Icon Asc | Icon Desc |
|------|----------|-----------|
| Alphanumeric (Operator, RAT) | i-lucide-arrow-up-a-z | i-lucide-arrow-down-a-z |
| Numeric (MCC, MNC) | i-lucide-arrow-up-0-1 | i-lucide-arrow-down-0-1 |
| Date (Scan Time) | i-lucide-calendar-arrow-up | i-lucide-calendar-arrow-down |
| Default (tidak di-sort) | i-lucide-arrow-up-down | i-lucide-arrow-up-down |

## 2. Breadcrumb Inline (app/pages/history.vue)
- Breadcrumb `Home › Scan History` inline dengan page title
- Title di kiri, breadcrumb di kanan (align right)

## 3. Halaman Utama/Empty State (app/pages/index.vue)
- Ganti "No Scan Available" → "Cellular Discovery" hero
- Ikon: `<span class="iconify i-lucide-radio-tower size-24 text-primary mb-6"></span>`
- Title: **Cellular Discovery**
- Subtitle: *Discovering and monitoring LTE, UMTS, and GSM network*

## 4. About Page Reword & Architecture (app/pages/about.vue)
- Judul diubah dari "USB Modem LTE Network Discovery Web Frontend" → "Discovering and monitoring LTE, UMTS, and GSM network"
- Deskripsi diubah termasuk mention UMTS dan GSM
- Hapus section Technology Stack
- Tambahkan System Architecture 3-tier (top → bottom: FE → Service → CLI) dengan background warna:
  - **Tier 1 (Top - Frontend)**: bg-blue-800 (info, gelap), icon putih, badge outlines
  - **Tier 2 (Middle - Service)**: bg-orange-800 (warning, gelap), icon putih, badge solid
  - **Tier 3 (Bottom - CLI)**: bg-green-800 (success, gelap), icon putih, badge subtle

## 5. Background on Filter & Table (app/pages/history.vue)
- Filter container: ditambah `bg-primary/5`
- Table container: ditambah `bg-primary/5`

## 6. Class CSS .bg-default (app/assets/css/main.css)
```css
.bg-default {
    background-color: var(--color-secondary-950);
}
```
Digunakan di:
- app/layouts/home.vue
- app/layouts/default.vue  
- app/components/AppNavbar.vue

## 7. README.md Diperhalus
- Badge shield.io dihapus
- Diagram arsitektur disederhanakan
- Section "Technology Stack" diganti "Technologies" (konsisten dengan about page)

---

✅ Semua build sukses tanpa error
✅ Semua perubahan di-commit dan push ke remote `main`