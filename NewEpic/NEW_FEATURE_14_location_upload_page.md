# Feature 14 — Location upload page (`/missions/[id]/locations/upload`)

| Field | Value |
|-------|-------|
| **Feature #** | 14 |
| **Title** | Location upload page |
| **Depends on** | 01–13 |
| **Blocks** | 18 |

---

## 1. Objective

A standalone page to upload a CSV of locations. Uses `<LocationUpload>`.

---

## 2. Files

### Create
- `app/pages/missions/[id]/locations/upload.vue`

---

## 3. Implementation Steps

### Step 1 — Create page

```vue
<!-- app/pages/missions/[id]/locations/upload.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Upload locations'
})

const route = useRoute()
const router = useRouter()
const missionId = route.params.id as string
const uploadRef = ref<InstanceType<typeof LocationUpload> | null>(null)

function onUploaded(count: number) {
  showSuccess(`Uploaded ${count} location(s).`)
  setTimeout(() => router.push(`/missions/${missionId}/locations`), 1000)
}

function onError(msg: string) {
  showError(msg)
}
</script>

<template>
  <div class="mx-auto max-w-3xl p-6">
    <NuxtLink to="/missions" class="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-default">
      <span class="i-lucide-arrow-left" /> Back to missions
    </NuxtLink>

    <h1 class="mb-2 text-2xl font-bold text-default">Upload locations</h1>
    <p class="mb-6 text-sm text-muted">Add GPS waypoints to this mission via CSV.</p>

    <LocationUpload :mission-id="missionId" @uploaded="onUploaded" @error="onError" ref="uploadRef" />
  </div>
</template>
```

---

## 4. Definition of Done

- [ ] Page renders with `<LocationUpload>`.
- [ ] On success, shows toast and redirects to locations list.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] Commit message: `feat(mission-planner): add location upload page (#14)`

---

## 5. Commit Message

```
feat(mission-planner): add location upload page (#14)

- Create app/pages/missions/[id]/locations/upload.vue
- Mount <LocationUpload> with missionId
- Show success toast and redirect on upload
```