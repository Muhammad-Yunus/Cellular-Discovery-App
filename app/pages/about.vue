<script setup lang="ts">
definePageMeta({ title: 'About' })

const config = useRuntimeConfig()
const appName = config.public.appName as string

const techStack = [
  { name: 'Nuxt 4', icon: 'i-lucide-globe', description: 'Full-stack framework' },
  { name: 'Vue 3', icon: 'i-lucide-code', description: 'Reactive UI components' },
  { name: 'TypeScript', icon: 'i-lucide-file-type', description: 'Type-safe code' },
  { name: 'Vite', icon: 'i-lucide-zap', description: 'Build tool' },
  { name: 'Pinia', icon: 'i-lucide-database', description: 'State management' },
  { name: 'TailwindCSS', icon: 'i-lucide-palette', description: 'Utility-first CSS' },
  { name: 'Leaflet', icon: 'i-lucide-map', description: 'Interactive maps' }
]

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
        USB Modem LTE Network Discovery Web Frontend
      </p>
      <p class="text-muted text-sm mt-2 leading-relaxed">
        A web-based interface for discovering and monitoring LTE networks using USB modems.
        Perform signal scans, view results on an interactive map, and manage configurations.
      </p>
    </UCard>

    <div>
      <h2 class="text-lg font-semibold text-highlighted mb-4">
        Technology Stack
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <UCard
          v-for="tech in techStack"
          :key="tech.name"
          class="w-full"
        >
          <div class="flex items-start gap-3">
            <span
              class="size-5 shrink-0 text-primary mt-0.5"
              :class="tech.icon"
            />
            <div>
              <p class="text-sm font-medium text-default">
                {{ tech.name }}
              </p>
              <p class="text-xs text-muted">
                {{ tech.description }}
              </p>
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
