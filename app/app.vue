<script setup lang="ts">
useHead({
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  title: 'Cellular Discovery',
  description: 'USB Modem Cellular Network Discovery Web Frontend'
})
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CustomToaster />
    <MissionsWebSocket />
  </div>
</template>