<template>
  <div class="h-screen flex flex-col bg-default text-default">
    <AppNavbar />
    <main class="flex-1 relative overflow-auto">
      <NuxtPage />
    </main>
    <ClientOnly><Sidebar /></ClientOnly>
    <ClientOnly><BottomPanel /></ClientOnly>
  </div>
</template>
