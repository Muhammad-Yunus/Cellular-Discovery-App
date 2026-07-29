<script setup lang="ts">
useHead({
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  title: 'LTE Scanner',
  description: 'USB Modem LTE Network Discovery Web Frontend'
})
</script>

<template>
  <UApp :toaster="null">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CustomToaster />
  </UApp>
</template>
