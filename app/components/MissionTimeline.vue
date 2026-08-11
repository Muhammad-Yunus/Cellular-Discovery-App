<!--
  app/components/MissionTimeline.vue
  ---------------------------------
  Visual timeline of the mission lifecycle status flow.
  
  Lifecycle order:
    IDLE → PLANNING → READY → STARTING → RUNNING → {PAUSED, COMPLETED, STOPPED, FAILED}
  
  Behaviour:
    - Past/visited statuses are filled with their semantic colour.
    - Current status is highlighted (bolder ring).
    - Future statuses are greyed out.
    - PAUSED/COMPLETED/STOPPED/FAILED are grouped into one chip.
      - If status <= STARTING: future shows "COMPLETED"
      - If status is terminal (PAUSED/COMPLETED/STOPPED/FAILED): shows that status
    
  Props:
    - status: current MissionStatus5 value
    - timeline: optional override array of { status, label, color }
-->
<script setup lang="ts">
import type { MissionStatus5 } from '~/types/mission'

const props = withDefaults(
  defineProps<{
    /** Current mission status */
    status: MissionStatus5
    /** Optional custom timeline segments — defaults to the canonical lifecycle */
    timeline?: { status: MissionStatus5; label: string; color: 'default' | 'success' | 'warning' | 'info' | 'error' }[]
  }>(),
  {}
)

const DEFAULT_TIMELINE = [
  { status: 'IDLE' as MissionStatus5, label: 'IDLE', color: 'default' as const },
  { status: 'PLANNING' as MissionStatus5, label: 'PLANNING', color: 'info' as const },
  { status: 'READY' as MissionStatus5, label: 'READY', color: 'info' as const },
  { status: 'STARTING' as MissionStatus5, label: 'STARTING', color: 'warning' as const },
  { status: 'RUNNING' as MissionStatus5, label: 'RUNNING', color: 'success' as const },
  { status: 'PAUSED' as MissionStatus5, label: 'PAUSED', color: 'warning' as const },
  { status: 'COMPLETED' as MissionStatus5, label: 'COMPLETED', color: 'info' as const },
  { status: 'STOPPED' as MissionStatus5, label: 'STOPPED', color: 'error' as const },
  { status: 'FAILED' as MissionStatus5, label: 'FAILED', color: 'error' as const }
]

// Terminal statuses that get grouped into one chip
const TERMINAL_STATUSES = ['PAUSED', 'COMPLETED', 'STOPPED', 'FAILED'] as const
const CURRENT_PHASE = ['IDLE', 'PLANNING', 'READY', 'STARTING', 'RUNNING'] as const

// Canonical linear order index for each status
const STATUS_ORDER = ['IDLE', 'PLANNING', 'READY', 'STARTING', 'RUNNING', 'PAUSED', 'COMPLETED', 'STOPPED', 'FAILED']

function getCurrentIndex(): number {
  return STATUS_ORDER.indexOf(props.status)
}

function isTerminalStatus(s: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(s)
}

function getStatusState(segment: { status: MissionStatus5 }) {
  const currentIdx = getCurrentIndex()
  const segIdx = STATUS_ORDER.indexOf(segment.status)
  if (segIdx < currentIdx) return 'past'
  if (segIdx === currentIdx) return 'current'
  return 'future'
}

function getDotClasses(segment: { status: MissionStatus5; color: 'default' | 'success' | 'warning' | 'info' | 'error' }) {
  const state = getStatusState(segment)
  const color = segment.color
  if (state === 'future') return '!bg-[#18181b] border-muted/70'
  // For 'default' color, use secondary colors so it's clearly visible
  if (color === 'default') return 'border-secondary-500 bg-secondary-600'
  return `border-${color} bg-${color}`
}

function getChipClasses(segment: { status: MissionStatus5; color: 'default' | 'success' | 'warning' | 'info' | 'error' }) {
  const state = getStatusState(segment)
  const color = segment.color
  if (state === 'future') return 'border-muted/40 bg-[#18181b] text-muted'
  // For 'default' color, use secondary colors so it matches the dot
  if (color === 'default') {
    if (state === 'current') return 'border-secondary-400 bg-secondary-700 text-secondary-100'
    return 'border-secondary-400/80 bg-secondary-700/80 text-secondary-100'
  }
  return `border-${color}/${state === 'current' ? '100' : '40'} bg-${color}/15 text-${color}`
}

// Build the computed timeline array
const timeline = computed(() => {
  if (props.timeline) return props.timeline

  const currentStatus = props.status
  const isTerminal = isTerminalStatus(currentStatus)

  const result: { status: MissionStatus5; label: string; color: 'default' | 'success' | 'warning' | 'info' | 'error' }[] = []

  // Add all current phase statuses (IDLE, PLANNING, READY, STARTING, RUNNING)
  for (const s of CURRENT_PHASE) {
    result.push({
      status: s,
      label: s,
      color: (DEFAULT_TIMELINE.find(t => t.status === s)?.color) as 'default' | 'success' | 'warning' | 'info' | 'error'
    })
  }

  // Add terminal chip
  if (isTerminal) {
    // Status is already terminal: show the actual status
    result.push({
      status: currentStatus,
      label: currentStatus,
      color: (DEFAULT_TIMELINE.find(t => t.status === currentStatus)?.color) as 'default' | 'success' | 'warning' | 'info' | 'error'
    })
  } else {
    // Status is in current phase (including RUNNING): show COMPLETED as future
    result.push({
      status: 'COMPLETED' as MissionStatus5,
      label: 'COMPLETED',
      color: 'info' as const
    })
  }

  return result
})
</script>

<template>
  <div class="border border-default/10 bg-elevated rounded-lg p-4">
    <h3 class="mb-3 text-sm font-semibold text-highlighted">Mission Lifecycle</h3>
    <div class="relative flex flex-col gap-2">
      <!-- Single continuous vertical line -->
      <div class="absolute left-[10px] top-2 bottom-2 w-px border-l border-secondary-400/50" />
      <template
        v-for="(segment, index) in timeline"
        :key="index"
      >
        <!-- Row: dot + chip -->
        <div class="relative grid grid-cols-[20px_1fr] gap-3 items-center">
          <!-- Dot -->
          <div class="relative flex justify-center z-10">
            <div
              class="flex size-5 items-center justify-center rounded-full border-2 transition-all"
              :class="getDotClasses(segment)"
            >
              <!-- Checkmark for past and current status -->
              <span
                v-if="getStatusState(segment) !== 'future'"
                class="text-xs font-bold text-white"
              >✓</span>
            </div>
          </div>
          <!-- Chip label -->
          <span
            class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-all w-fit"
            :class="getChipClasses(segment)"
          >
            {{ segment.label }}
          </span>
        </div>
      </template>
    </div>
  </div>
</template>
