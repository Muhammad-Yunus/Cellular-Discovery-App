<script setup lang="ts">
definePageMeta({ title: 'About' })

const config = useRuntimeConfig()
const appName = config.public.appName as string

const { health, loading: healthLoading } = useSystem()
</script>

<template>
  <div class="p-4 md:p-6 max-w-3xl mx-auto space-y-8">
    <UCard class="w-full">
      <template #header>
        <h1 class="text-2xl font-bold text-highlighted">
          {{ appName }}
        </h1>
      </template>

      <p class="text-default leading-relaxed">
        Discovering and monitoring LTE, UMTS, and GSM network
      </p>
      <p class="text-muted text-sm mt-2 leading-relaxed">
        A web-based interface for discovering and monitoring LTE, UMTS and GSM networks.
        Perform signal scans, view results on an interactive map, and manage configurations.
      </p>
    </UCard>

    <div>
      <h2 class="text-lg font-semibold text-highlighted mb-4">
        System Architecture
      </h2>
      <div class="grid grid-cols-1 gap-3">
        <!-- Tier 1: Frontend (top) - info/blue -->
        <UCard class="w-full bg-blue-800">
          <div class="flex items-start gap-3">
            <span class="iconify i-lucide-monitor size-5 shrink-0 text-white mt-0.5" />
            <div class="flex-1">
              <p class="text-sm font-medium text-default">
                Frontend Web Application (this app)
              </p>
              <p class="text-xs text-muted mt-1">
                Reactive UI rendering maps, scans, and live telemetry
              </p>
              <div class="flex flex-wrap gap-2 mt-3">
                <UBadge color="blue" variant="subtle" size="sm" class="border border-blue-700 bg-blue-900 text-white">
                  Vue 3
                </UBadge>
                <UBadge color="blue" variant="subtle" size="sm" class="border border-blue-700 bg-blue-900 text-white">
                  Nuxt
                </UBadge>
                <UBadge color="blue" variant="subtle" size="sm" class="border border-blue-700 bg-blue-900 text-white">
                  Vite
                </UBadge>
                <UBadge color="blue" variant="subtle" size="sm" class="border border-blue-700 bg-blue-900 text-white">
                  Pinia
                </UBadge>
                <UBadge color="blue" variant="subtle" size="sm" class="border border-blue-700 bg-blue-900 text-white">
                  Leaflet
                </UBadge>
                <UBadge color="blue" variant="subtle" size="sm" class="border border-blue-700 bg-blue-900 text-white">
                  Tailwind
                </UBadge>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Tier 2: Service (middle) - warning/orange -->
        <UCard class="w-full bg-orange-800">
          <div class="flex items-start gap-3">
            <span class="iconify i-lucide-server size-5 shrink-0 text-white mt-0.5" />
            <div class="flex-1">
              <p class="text-sm font-medium text-default">
                Cellular Discovery Service
              </p>
              <p class="text-xs text-muted mt-1">
                Orchestrates CLI tools, persists data, and streams updates
              </p>
              <div class="flex flex-wrap gap-2 mt-3">
                <UBadge color="orange" variant="subtle" size="sm" class="border border-orange-700 bg-orange-900 text-white">
                  FastAPI
                </UBadge>
                <UBadge color="orange" variant="subtle" size="sm" class="border border-orange-700 bg-orange-900 text-white">
                  PostgreSQL
                </UBadge>
                <UBadge color="orange" variant="subtle" size="sm" class="border border-orange-700 bg-orange-900 text-white">
                  WebSocket
                </UBadge>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Tier 3: CLI Tools (bottom) - success/green -->
        <UCard class="w-full bg-green-800">
          <div class="flex items-start gap-3">
            <span class="iconify i-lucide-terminal size-5 shrink-0 text-white mt-0.5" />
            <div class="flex-1">
              <p class="text-sm font-medium text-default">
                CLI Tools (Data Acquisition Layer)
              </p>
              <p class="text-xs text-muted mt-1">
                Raw signal & modem command-line interfaces
              </p>
              <div class="flex flex-wrap gap-2 mt-3">
                <UBadge color="green" variant="subtle" size="sm" class="border border-green-700 bg-green-900 text-white">
                  USB Modem CLI
                </UBadge>
                <UBadge color="green" variant="subtle" size="sm" class="border border-green-700 bg-green-900 text-white">
                  RTL-SDR CLI
                </UBadge>
                <UBadge color="green" variant="subtle" size="sm" class="border border-green-700 bg-green-900 text-white">
                  HackRF CLI
                </UBadge>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <UCard
      v-if="health && !healthLoading"
      class="w-full"
    >
      <template #header>
        <h2 class="text-base font-semibold text-highlighted">
          Backend
        </h2>
      </template>

      <div class="space-y-1 text-sm">
        <div class="flex justify-between">
          <span class="text-muted">Version</span>
          <span class="text-default">{{ health.version || '-' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted">Status</span>
          <StatusBadge
            :status="health.status === 'ok' ? 'ok' : 'error'"
            :label="health.status === 'ok' ? 'Online' : 'Offline'"
          />
        </div>
        <div class="flex justify-between">
          <span class="text-muted">Uptime</span>
          <span class="text-default">{{ health.uptime ? `${health.uptime}s` : '-' }}</span>
        </div>
      </div>
    </UCard>
  </div>
</template>