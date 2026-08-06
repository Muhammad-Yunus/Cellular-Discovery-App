<!-- app/components/MissionsWebSocket.vue -->
<!--
  Global side-effect component that connects to the collector
  WebSocket and dispatches live mission events into the mission store.
-->
<script setup lang="ts">
import { useMissionWebSocket } from '~/composables/useMissionWebSocket'

// The composable handles connect/disconnect internally via onMounted / onUnmounted.
// It also keeps a reference to the WebSocket alive for the lifetime of the app.
useMissionWebSocket()
</script>

<template>
  <!-- No visual output — purely a side-effect component -->
  <div class="hidden" aria-hidden="true" />
</template>
