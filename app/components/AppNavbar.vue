<script setup lang="ts">
const route = useRoute()
const appName = useRuntimeConfig().public.appName

const navLinks = [
  { label: 'Home', to: '/', icon: 'lucide:home' },
  { label: 'Scan History', to: '/history', icon: 'lucide:history' },
  { label: 'Missions', to: '/missions', icon: 'lucide:rocket' },
  { label: 'Device', to: '/device', icon: 'lucide:router' },
  { label: 'About', to: '/about', icon: 'lucide:info' }
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <header class="sticky top-0 z-[1200] border-b border-muted bg-default/95 backdrop-blur-sm">
    <div class="flex items-center justify-between h-14 px-4 max-w-screen-2xl mx-auto w-full">
      <div class="flex items-center gap-8">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 shrink-0"
        >
          <Icon
            name="lucide:radio-tower"
            class="text-primary text-xl"
            aria-hidden="true"
          />
          <span class="font-semibold text-sm text-default tracking-tight">{{ appName }}</span>
        </NuxtLink>

        <nav class="hidden md:flex items-center gap-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors"
            :class="isActive(link.to)
              ? 'bg-accented text-highlighted font-medium'
              : 'text-muted hover:text-default hover:bg-accented/50'"
          >
            <Icon
              :name="link.icon"
              class="text-base shrink-0"
              aria-hidden="true"
            />
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>
    </div>
  </header>
</template>
