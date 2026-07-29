<script setup lang="ts">
const route = useRoute()
const appName = useRuntimeConfig().public.appName

const navLinks = [
  { label: 'Home', to: '/', icon: 'i-lucide-home' },
  { label: 'Scan Result', to: '/history', icon: 'i-lucide-list-todo' },
  { label: 'Settings', to: '/settings', icon: 'i-lucide-settings' },
  { label: 'About', to: '/about', icon: 'i-lucide-info' }
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-muted bg-default/95 backdrop-blur-sm">
    <div class="flex items-center justify-between h-14 px-4 max-w-screen-2xl mx-auto w-full">
      <div class="flex items-center gap-8">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 shrink-0"
        >
          <span class="i-lucide-scan-line text-primary text-xl" />
          <span class="font-semibold text-sm text-default tracking-tight">{{ appName }}</span>
        </NuxtLink>

        <nav class="hidden md:flex items-center gap-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors"
            :class="isActive(link.to)
              ? 'bg-accented text-highlighted font-medium'
              : 'text-muted hover:text-default hover:bg-accented/50'"
          >
            <span
              :class="link.icon"
              class="text-base"
            />
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>
    </div>
  </header>
</template>
