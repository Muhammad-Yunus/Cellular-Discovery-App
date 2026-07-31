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

## 4. README.md Diperhalus
- Badge shield.io dihapus
- Diagram arsitektur disederhanakan

## 5. Class CSS .bg-default (app/assets/css/main.css)
```css
.bg-default {
    background-color: var(--color-secondary-950);
}
```
Digunakan di:
- app/layouts/home.vue
- app/layouts/default.vue  
- app/components/AppNavbar.vue

---

✅ Semua build sukses tanpa error
✅ Semua perubahan di-commit dan push ke remote `main`
