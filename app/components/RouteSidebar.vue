// app/components/RouteSidebar.vue
//
// Draggable list of mission locations shown as the left sidebar of the Route
// tab. Each card displays the tower icon, tower ID, tower name, and the
// current sequence_order. Drag-and-drop reordering calls
// `reorderRoute()` on the collector mission store.

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useCollectorMissionStore } from '~/stores/mission'

const props = defineProps<{
  missionId: string
  collapsed?: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const missionStore = useCollectorMissionStore()

const isIdle = computed(() => missionStore.selectedMission?.status === 'IDLE')

/**
 * Items displayed in the sidebar. Prefer the authoritative route payload
 * (GET /missions/{id}/route) which carries distance/bearing and the
 * server-ordered sequence. Fall back to the locations list when the route
 * endpoint hasn't loaded yet (e.g. before Plan is called).
 */
const locations = computed(() => {
  const routeItems = missionStore.route?.items
  if (routeItems && routeItems.length > 0) return routeItems
  return [...(missionStore.locations ?? [])]
    .filter((l): l is NonNullable<typeof l> => l.sequence_order != null)
    .sort((a, b) => (a.sequence_order ?? 0) - (b.sequence_order ?? 0))
})

/** Drag state for the currently-dragged location. */
const dragIndex = ref<number | null>(null)
const overIndex = ref<number | null>(null)
/** Tab/slot ref list used to trigger a brief "snap" animation when a
 * drop completes and the store updates the location order. */
const cardRefs = ref<HTMLDivElement[]>([])
/** Indexes that should bounce on the next render cycle. */
const bouncingIndexes = ref<Set<number>>(new Set())
/** Indexes that should flash to advertise the reorder result. */
const flashingIndexes = ref<Set<number>>(new Set())

/**
 * Called when a card begins being dragged. Store the index of the dragged
 * item so we can identify the source in onDrop. `e.dataTransfer` must be
 * configured with at least one effect — otherwise HTML5 drag silently
 * aborts on some browsers (Chromium in particular).
 */
function onDragStart(index: number, e: DragEvent) {
  dragIndex.value = index
  if (e.dataTransfer) {
    // Required for Chrome/Firefox to actually start the drag operation.
    e.dataTransfer.effectAllowed = 'move'
    // Some browsers require a non-empty `types` for drag to fire `drop`.
    e.dataTransfer.setData('text/plain', String(index))
  }
}

/**
 * Called when a dragged card is moved over another card. Highlight the
 * target so the user can see where the card will land. Without
 * `preventDefault` here, the `drop` event never fires.
 */
function onDragOver(index: number, e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  overIndex.value = index
}

/** Clear the hover indicator when the dragged card leaves a target. */
function onDragLeave() {
  overIndex.value = null
}

/** Reset drag state if the user cancels (Esc, drop outside, etc.). */
function onDragEnd() {
  dragIndex.value = null
  overIndex.value = null
}

/**
 * Called when a dragged card is dropped. Reorder the local list and
 * post the new sequence_order to POST /missions/{id}/route/reorder.
 * Triggers a "snap" animation on the dropped card and a brief flash on
 * the card that was displaced.
 */
async function onDrop(targetIndex: number, e: DragEvent) {
  e.preventDefault()
  if (dragIndex.value == null || dragIndex.value === targetIndex) {
    dragIndex.value = null
    overIndex.value = null
    return
  }

  const items = locations.value
  const dragItem = items[dragIndex.value]
  if (!dragItem) return

  // Build the reordered list: remove the dragged item, insert it at the
  // target position, then reassign sequence_order = position + 1.
  const reordered = [...items]
  reordered.splice(dragIndex.value, 1)
  reordered.splice(targetIndex, 0, dragItem)
  const payload = reordered.map((loc, i) => ({
    location_id: loc.id,
    sequence_order: i + 1
  }))

  try {
    await missionStore.reorderRoute(props.missionId, payload)
  } finally {
    // Trigger drop-feedback animations after the DOM updates to reflect
    // the new order. `nextTick` + a tiny extra delay lets Vue flush the
    // reordered list first, so the animated cards land on their new
    // positions (not stale ones).
    dragIndex.value = null
    overIndex.value = null
    nextTick(() => {
      requestAnimationFrame(() => {
        triggerDropAnimations(targetIndex, dragIndex.value ?? targetIndex)
      })
    })
  }
}

/**
 * When a drop lands, give the target card a satisfying "snap" bounce and
 * flash the displaced card(s) briefly so the user can clearly see the
 * new order.
 */
function triggerDropAnimations(targetIndex: number) {
  bouncingIndexes.value = new Set([targetIndex])
  flashingIndexes.value = new Set([targetIndex])
  setTimeout(() => {
    bouncingIndexes.value = new Set()
    flashingIndexes.value = new Set()
  }, 800)
}

function truncateName(name: string, max = 12): string {
  return name.length > max ? `${name.slice(0, max)}…` : name
}
</script>

<template>
  <div
    data-testid="route-sidebar"
    class="absolute left-4 top-4 bottom-4 z-[500] flex flex-col overflow-hidden rounded-xl border border-muted bg-black/70 backdrop-blur-md shadow-lg pointer-events-auto transition-all duration-200"
    :class="props.collapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-[300px] opacity-100'"
  >
    <div class="flex items-center justify-between border-b border-muted px-3 py-2 shrink-0">
      <h2 class="text-sm font-semibold text-default">
        Route Sequence
      </h2>
      <div class="flex items-center gap-2">
        <span class="text-xs text-muted">
          {{ locations.length }} stop{{ locations.length === 1 ? '' : 's' }}
        </span>
        <button
          type="button"
          @click="emit('toggle')"
          class="flex size-5 items-center justify-center rounded text-muted transition-colors hover:bg-muted/20 hover:text-default"
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
      <div
        v-if="locations.length === 0"
        class="py-8 text-center text-sm text-muted"
      >
        No sequence assigned yet.
        <br />Plan the route first.
      </div>
      <div
        v-for="(loc, index) in locations"
        :ref="el => { if (el) cardRefs[index] = el as HTMLDivElement }"
        :key="loc.id"
        :draggable="isIdle"
        @dragstart="isIdle && onDragStart(index, $event)"
        @dragover="isIdle && onDragOver(index, $event)"
        @dragleave="isIdle && onDragLeave()"
        @drop="isIdle && onDrop(index, $event)"
        @dragend="isIdle && onDragEnd()"
        @mousedown.stop
        @pointerdown.stop
        class="route-sequence-card flex select-none items-center gap-2 rounded-lg border border-default/10 bg-elevated px-3 py-2 transition-colors hover:bg-accented"
        :class="{
          'opacity-60': dragIndex === index,
          'ring-2 ring-primary ring-offset-1 ring-offset-transparent': overIndex === index && dragIndex !== index,
          'route-sequence-card--drop': bouncingIndexes.has(index),
          'route-sequence-card--flash': flashingIndexes.has(index)
        }"
        :title="isIdle ? `Drag to reorder (current: ${loc.sequence_order})` : 'Reorder disabled — mission must be IDLE'"
      >
        <!-- Drag handle (IDLE) / Lock icon (not IDLE) -->
        <span
          class="route-sequence-card__handle mt-px shrink-0 text-muted"
          aria-hidden="true"
        >
          <svg
            v-if="isIdle"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
          <UIcon
            v-else
            name="lucide:lock"
            class="size-3.5 shrink-0 text-muted"
            aria-hidden="true"
          />
        </span>

        <!-- Sequence badge -->
        <span
          class="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary bg-primary/10"
        >
          {{ loc.sequence_order }}
        </span>

        <!-- Tower icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="shrink-0 text-muted"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9m2.9 2.8a6.14 6.14 0 0 0 -.8 7.5" />
          <circle cx="12" cy="9" r="2" />
          <path d="M16.2 4.8c2 2 2.26 5.11.8 7.47M19.1 1.9a9.96 9.96 0 0 1 0 14.1m-9.6 2h5 M8 22l4-11l4 11" />
        </svg>

        <!-- Tower info -->
        <div class="flex min-w-0 flex-1 items-center justify-between gap-2">
          <div class="flex min-w-0 flex-1 flex-col">
            <span
              class="truncate text-xs font-semibold text-default"
              title="Tower ID"
            >{{ loc.cellular_tower_id }}</span>
            <span
              class="truncate text-[11px] text-muted"
              :title="loc.cellular_tower_name"
            >{{ truncateName(loc.cellular_tower_name, 16) }}</span>
          </div>
          <!-- Status chip (right-aligned) -->
          <span
            v-if="loc.status"
            class="shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="{
              'bg-primary/10 text-primary': loc.status === 'PENDING',
              'bg-warning/10 text-warning': loc.status === 'IN_PROGRESS',
              'bg-success/10 text-success': loc.status === 'VISITED',
              'bg-neutral/10 text-muted': loc.status === 'SKIPPED' || loc.status === 'FAILED'
            }"
          >
            {{ loc.status }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.route-sequence-card {
  cursor: grab;
  /* Force the browser to treat the entire card as a draggable handle.
   * Without this, some browsers refuse to initiate the drag because the
   * user clicked on an inline child element (e.g. <svg>) which itself is
   * not draggable. */
  -webkit-user-drag: element;
  /* Prevent text-selection interfering with the grab gesture. */
  user-select: none;
  -webkit-user-select: none;
  /* Allow vertical scrolling on the container, horizontal pan on map. */
  touch-action: pan-y;
}

.route-sequence-card:not([draggable="true"]) {
  cursor: not-allowed;
  opacity: 0.7;
}

.route-sequence-card:active {
  cursor: grabbing;
}

.route-sequence-card__handle {
  cursor: grab;
}

/* Drop feedback: brief elastic "snap" bounce on the card that landed. */
@keyframes route-card-snap-bounce {
  0%   { transform: translateY(0) scale(1); }
  20%  { transform: translateY(-4px) scale(1.02); }
  40%  { transform: translateY(2px) scale(0.99); }
  60%  { transform: translateY(-1px) scale(1.005); }
  80%  { transform: translateY(0.5px) scale(1); }
  100% { transform: translateY(0) scale(1); }
}

.route-sequence-card--drop {
  animation: route-card-snap-bounce 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* Drop feedback: brief highlight flash to signal "this slot is updated". */
@keyframes route-card-flash {
  0%   { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
  30%  { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.35); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.route-sequence-card--flash {
  animation: route-card-flash 0.8s ease-out both;
}
</style>
