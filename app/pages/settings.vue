<script setup lang="ts">
import type { Setting } from '~/types'

definePageMeta({ title: 'Settings' })

const {
  settings,
  loading,
  saving,
  dirty,
  error,
  fetchSettings,
  updateField,
  save,
  reset
} = useSettings()

const validations = ref<Record<string, string>>({})

function isBooleanKey(key: string): boolean {
  return ['notification_enabled', 'notificationEnabled', 'auto_connect', 'autoConnect', 'dark_mode', 'darkMode', 'gps_enabled', 'gpsEnabled'].includes(key)
}

function isNumericKey(key: string): boolean {
  return ['polling_interval', 'pollingInterval', 'scan_interval', 'scanInterval', 'map_zoom', 'mapZoom', 'port'].includes(key)
}

function isUrlKey(key: string): boolean {
  return key.toLowerCase().includes('url') || key.toLowerCase().includes('endpoint') || key.toLowerCase().includes('host')
}

function getFieldType(setting: Setting): 'switch' | 'number' | 'text' {
  if (isBooleanKey(setting.key)) return 'switch'
  if (isNumericKey(setting.key)) return 'number'
  return 'text'
}

function validateField(key: string, value: string) {
  const errors = { ...validations.value }

  if (!value.trim()) {
    errors[key] = 'This field is required'
  } else if (isUrlKey(key) && !/^https?:\/\/.+/.test(value)) {
    errors[key] = 'Must be a valid URL (http://...)'
  } else if (isNumericKey(key) && isNaN(Number(value))) {
    errors[key] = 'Must be a valid number'
  } else {
    errors[key] = ''
  }

  validations.value = errors
}

function validateAll(): boolean {
  const errors: Record<string, string> = {}
  for (const s of settings.value) {
    if (!s.value.trim()) {
      errors[s.key] = 'This field is required'
    } else if (isUrlKey(s.key) && !/^https?:\/\/.+/.test(s.value)) {
      errors[s.key] = 'Must be a valid URL (http://...)'
    } else if (isNumericKey(s.key) && isNaN(Number(s.value))) {
      errors[s.key] = 'Must be a valid number'
    }
  }
  validations.value = errors
  return Object.keys(errors).length === 0
}

function onUpdateField(key: string, value: string) {
  updateField(key, value)
  validateField(key, value)
}

async function onSave() {
  if (!validateAll()) return
  await save()
}

function onReset() {
  reset()
  validations.value = {}
}

function booleanValue(key: string): boolean {
  const s = settings.value.find(x => x.key === key)
  return s?.value === 'true'
}

function onBooleanChange(key: string, val: boolean) {
  updateField(key, val ? 'true' : 'false')
  validations.value[key] = ''
}
</script>

<template>
  <div class="p-4 md:p-6 max-w-2xl mx-auto min-h-screen">
    <!-- Inline Breadcrumb + Page Title, aligned right -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-semibold text-highlighted">
          Settings
        </h1>
        <p class="text-sm text-muted mt-1">
          Configure app, account, and device preferences
        </p>
      </div>
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-muted">
        <NuxtLink to="/" class="flex items-center gap-1 text-primary hover:text-accented transition-colors">
          <Icon name="lucide:home" class="text-base shrink-0" aria-hidden="true" />
          Home
        </NuxtLink>
        <span class="text-muted">›</span>
        <span class="flex items-center gap-1 text-highlighted">
          <Icon name="lucide:settings" class="text-base shrink-0" aria-hidden="true" />
          Settings
        </span>
      </div>
    </div>

    <div
      v-if="loading"
      class="space-y-4"
    >
      <USkeleton
        v-for="i in 4"
        :key="i"
        class="h-14 w-full"
      />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      icon="i-lucide-alert-circle"
      title="Failed to load settings"
      :description="error"
      variant="soft"
      class="mb-4"
    >
      <template #footer>
        <UButton
          label="Retry"
          color="neutral"
          variant="outline"
          @click="fetchSettings"
        />
      </template>
    </UAlert>

    <div
      v-else-if="settings.length === 0"
      class="text-center py-16 text-muted"
    >
      <span class="i-lucide-settings text-4xl mb-3 block" />
      <p>No settings available</p>
    </div>

    <template v-else>
      <div class="px-6 py-4 border border-muted rounded-md mb-6 bg-primary/5">
        <div class="space-y-5">
          <div
            v-for="setting in settings"
            :key="setting.key"
            class="space-y-1"
          >
            <UFormField
              v-if="getFieldType(setting) === 'switch'"
              :label="setting.key"
              :description="setting.description"
              :error="validations[setting.key]"
              :name="setting.key"
            >
              <USwitch
                :model-value="booleanValue(setting.key)"
                @update:model-value="(v: boolean) => onBooleanChange(setting.key, v)"
              />
            </UFormField>

            <UFormField
              v-else
              :label="setting.key"
              :description="setting.description"
              :error="validations[setting.key]"
              :name="setting.key"
            >
              <UInput
                :model-value="setting.value"
                :type="getFieldType(setting) === 'number' ? 'number' : 'text'"
                :placeholder="`Enter ${setting.key}`"
                class="w-full"
                @update:model-value="(v: string) => onUpdateField(setting.key, v)"
              />
            </UFormField>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 pt-2">
        <UButton
          label="Save"
          color="primary"
          :disabled="!dirty || saving"
          :loading="saving"
          @click="onSave"
        />
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          :disabled="saving"
          @click="onReset"
        />
      </div>
    </template>
  </div>
</template>
