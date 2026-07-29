# FEATURE: Settings Page
**Epic:** #12
**Depends on:** #2 Types & Services, #3 Stores & Composables
**Status:** Pending

## User Story
Sebagai user, saya ingin melihat dan mengubah pengaturan aplikasi melalui halaman settings, sehingga saya bisa mengonfigurasi parameter sistem.

## Acceptance Criteria
- [ ] `pages/settings.vue` menampilkan form settings
- [ ] Form di-populate dari GET /settings saat halaman dimuat
- [ ] User dapat mengubah field settings
- [ ] Save button mengirim PUT /settings
- [ ] Loading state saat fetch dan save
- [ ] Success toast setelah save berhasil
- [ ] Error toast jika save gagal
- [ ] Field validation (client-side) sebelum submit
- [ ] Dirty state tracking: hanya enable Save button jika ada perubahan
- [ ] Cancel/reset button: revert ke original values
- [ ] Responsive layout
- [ ] Unit test: load settings, edit, save, reset

## Tasks
- [ ] Update `services/settings.service.ts` (sama dengan Epic #2)
- [ ] Update `stores/settingsStore.ts`:
  - State: settings, originalSettings, loading, saving, dirty (computed)
  - Actions: fetchSettings, saveSettings, updateField, reset
- [ ] Update `composables/useSettings.ts`:
  - Load settings on mount
  - Expose: settings, loading, saving, dirty, save(), reset(), updateField()
  - Handle save: call service, update store, toast
- [ ] Buat `pages/settings.vue`:
  - Form fields sesuai Setting type
  - Load settings via useSettings composable
  - Save/Cancel buttons
  - TailwindCSS dark form styling
  - Responsive layout
- [ ] Client-side validation:
  - Required fields check
  - Type validation (number fields, URL fields)
  - Show inline error messages
- [ ] Handle edge cases: empty settings, network error on load, network error on save
- [ ] Unit test: form rendering, field update, save, reset, validation errors

## Components Touched
- pages/settings.vue
- services/settings.service.ts (update)
- stores/settingsStore.ts (update)
- composables/useSettings.ts (update)

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
- Endpoint: GET /settings, PUT /settings
- Setting type fields (contoh dari backend): pollingInterval, mapZoom, defaultCenter, notificationEnabled, dsb.
- Pastikan sync types dengan backend Pydantic Setting model
- Form: Nuxt UI UForm atau native form dengan Tailwind
- Use `storeToRefs(settingsStore)` for reactivity
- Dirty check: deep compare current vs original menggunakan JSON.stringify atau lodash.isequal (jika sudah ada)
- Jangan use `watch` deep — gunakan computed yang compare two objects
