<!--
  app/components/MissionCard.vue
  -----------------------
  Reusable card for a single mission in the planner list. Designed to be
  driven by either the legacy `Mission` shape or the new collector
  `MissionRecord` — the consumer is expected to pre-shape the data
  (see `missionGridItem` below). Card emits:
   - `view`      → consumer should navigate to the detail page.
   - `start`     → start the mission lifecycle.
   - `pause`     → pause an active mission.
   - `complete`  → complete an in-progress mission.
   - `cancel`    → cancel the mission.
   - `delete`    → delete the mission (the confirmation prompt is handled here).

  All callbacks are optional; the card degrades gracefully and simply
  hides the corresponding button when the lifecycle transition is not
  allowed by the current status.
-->
<script setup lang="ts">
import type { MissionStatus5, MissionRecord } from '~/types/mission'
import { MISSION_STATUS_COLOR, MISSION_STATUS_LABELS } from '~/types/mission'

interface MissionGridItem {
  id: string
  name: string
  status: MissionStatus5
  description?: string | null
  location_count?: number
  scan_count?: number
  center_lat?: number | null
  center_lon?: number | null
  created_at?: string
  updated_at?: string
  /** Allow passing a full MissionRecord and pull what we need. */
  record?: MissionRecord
}

const props = withDefaults(
  defineProps<{
    /**
     * The mission data. Either pass a MissionRecord directly, or a
     * reduced MissionGridItem with at minimum { id, name, status }.
     */
    mission: MissionGridItem
    /** Hide the bottom action row entirely. */
    noActions?: boolean
  }>(),
  { noActions: false }
)

const emit = defineEmits<{
  view: [id: string]
  start: [id: string]
  pause: [id: string]
  complete: [id: string]
  cancel: [id: string]
  delete: [id: string]
}>()

// ---- Derived display values ---------------------------------------------------
const missionName = computed(() => props.mission.name)
const missionStatus = computed<MissionStatus5>(() => props.mission.status)
const missionDescription = computed(() => props.mission.description ?? '')
const locationCount = computed(() => Number(props.mission.location_count ?? 0))
const scanCount = computed(() => Number(props.mission.scan_count ?? 0))

const statusLabel = computed(
  () => MISSION_STATUS_LABELS[missionStatus.value] ?? missionStatus.value
)
const statusColor = computed(
  () => MISSION_STATUS_COLOR[missionStatus.value] ?? 'default'
)

// ---- Lifecycle helpers --------------------------------------------------------
/** True when the "Start" button should be enabled. */
const canStart = computed(
  () => missionStatus.value === 'draft' || missionStatus.value === 'paused'
)
/** True when the "Pause" button should be enabled. */
const canPause = computed(() => missionStatus.value === 'active')
/** True when the "Complete" button should be enabled. */
const canComplete = computed(() => missionStatus.value === 'active')
/** True when the "Cancel" button should be enabled. */
const canCancel = computed(
  () =>
    missionStatus.value !== 'completed' &&
    missionStatus.value !== 'cancelled'
)

// ---- Date display -------------------------------------------------------------
function formatDate(isoStr?: string | null): string {
  if (!isoStr) return '—'
  try {
    return new Date(isoStr).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '—'
  }
}

// ---- Handlers -----------------------------------------------------------------
function onView() {
  emit('view', props.mission.id)
}
function onStart() {
  emit('start', props.mission.id)
}
function onPause() {
  emit('pause', props.mission.id)
}
function onComplete() {
  emit('complete', props.mission.id)
}
function onCancel() {
  emit('cancel', props.mission.id)
}
function onDelete() {
  // Native confirm — kept simple; pages can also intercept by listening
  // to the raw event. If the consumer does not handle the deletion, we
  // still emit so the parent can decide.
  if (!window.confirm(`Delete mission "${missionName.value}"? This cannot be undone.`)) {
    return
  }
  emit('delete', props.mission.id)
}
</script>

<template>
  <article
    class="rounded-lg border border-default/10 bg-default p-4 transition-colors hover:border-primary/40"
    data-testid="mission-card"
    :data-mission-id="mission.id"
    :data-mission-status="missionStatus"
  >
    <!-- Header -->
    <header class="mb-3 flex items-start justify-between gap-2">
      <div class="min-w-0 flex-1">
        <h3
          class="cursor-pointer truncate text-sm font-semibold text-default hover:text-primary"
          @click="onView"
          data-testid="mission-card-title"
        >
          {{ missionName }}
        </h3>
        <p class="mt-0.5 text-xs text-muted">
          {{ locationCount }} location{{ locationCount !== 1 ? 's' : '' }}
          <span class="mx-1">·</span>
          {{ scanCount }} scan{{ scanCount !== 1 ? 's' : '' }}
        </p>
      </div>
      <UBadge
        :color="statusColor"
        variant="subtle"
        size="sm"
        data-testid="mission-card-status"
      >
        {{ statusLabel }}
      </UBadge>
    </header>

    <!-- Description -->
    <p
      v-if="missionDescription"
      class="mb-3 line-clamp-2 text-sm text-muted"
    >
      {{ missionDescription }}
    </p>

    <!-- Center coordinates -->
    <div
      v-if="mission.center_lat !== undefined && mission.center_lon !== undefined &&
        mission.center_lat !== null && mission.center_lon !== null"
      class="mb-3 flex items-center gap-2 text-xs text-muted"
    >
      <span class="i-lucide-map-pin text-[10px]" />
      <span class="font-mono">
        {{ Number(mission.center_lat).toFixed(4) }},
        {{ Number(mission.center_lon).toFixed(4) }}
      </span>
    </div>

    <!-- Updated timestamp -->
    <p class="mb-3 text-xs text-muted">
      Updated {{ formatDate(mission.updated_at ?? mission.created_at ?? null) }}
    </p>

    <!-- Actions -->
    <footer
      v-if="!noActions"
      class="flex items-center gap-1 border-t border-default/10 pt-3"
    >
      <UButton
        size="xs"
        variant="ghost"
        icon="i-lucide-eye"
        label="View"
        @click="onView"
      />
      <UButton
        size="xs"
        variant="ghost"
        icon="i-lucide-play"
        label="Start"
        :disabled="!canStart"
        @click="onStart"
      />
      <UButton
        size="xs"
        variant="ghost"
        icon="i-lucide-pause"
        label="Pause"
        :disabled="!canPause"
        @click="onPause"
      />
      <UButton
        size="xs"
        variant="ghost"
        icon="i-lucide-check"
        label="Complete"
        :disabled="!canComplete"
        @click="onComplete"
      />
      <UButton
        size="xs"
        variant="ghost"
        icon="i-lucide-flag"
        label="Cancel"
        :disabled="!canCancel"
        @click="onCancel"
      />
      <UButton
        size="xs"
        variant="ghost"
        color="error"
        icon="i-lucide-trash-2"
        label="Delete"
        class="ml-auto"
        @click="onDelete"
      />
    </footer>
  </article>
</template>
