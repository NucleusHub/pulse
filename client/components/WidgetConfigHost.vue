<script setup>
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import { usePulse } from '../composables/usePulse.js'
import { useDashboard } from '../composables/useDashboard.js'
import { useRegistry } from '@core/useRegistry.js'

// Wiring for the shared widget settings modal, rendered by the host (the hub)
// through Pulse's hub extension (see ../hub.js). Pulse's gear button opens it via
// usePulse().openConfig(id); this resolves the widget's Config.vue and binds its
// saved Pulse state (config + cross-app visibility) to the shared modal,
// committing on Save. The modal chrome + the "Show in" toggle live in the shared
// widget package (@widgets-core) so every app renders widgets the same way. That
// package is optional, so it's globbed rather than imported: without it there
// are no widgets to configure and this renders nothing.
const [modalLoader] = Object.values(import.meta.glob('@widgets-core/components/WidgetConfigModal.vue'))
const WidgetConfigModal = modalLoader ? defineAsyncComponent(modalLoader) : null
const [resolver] = Object.values(import.meta.glob('@widgets-core/resolve.js', { eager: true }))
const resolveWidgetConfig = resolver?.resolveWidgetConfig ?? (() => null)

const { configWidgetId, closeConfig } = usePulse()
const { widgets: manifests } = useRegistry()
const { getWidgetState, setWidgetState, saveState } = useDashboard()

const manifest = computed(() => manifests.value.find(m => m.id === configWidgetId.value) || null)
const ConfigComp = computed(() => configWidgetId.value ? resolveWidgetConfig(configWidgetId.value) : null)

// Draft copies so edits aren't committed until "Save".
const config = ref({})
const visibility = ref({ scope: 'dashboard', apps: [] })

watch(configWidgetId, (id) => {
  if (!id) return
  const saved = getWidgetState(id) ?? {}
  config.value = JSON.parse(JSON.stringify(saved.config ?? {}))
  const v = saved.visibility ?? {}
  visibility.value = { scope: v.scope === 'apps' ? 'apps' : 'dashboard', apps: Array.isArray(v.apps) ? [...v.apps] : [] }
}, { immediate: true })

function save() {
  const id = configWidgetId.value
  if (id) {
    setWidgetState(id, {
      config: JSON.parse(JSON.stringify(config.value)),
      visibility: JSON.parse(JSON.stringify(visibility.value)),
    })
    saveState()
  }
  closeConfig()
}
</script>

<template>
  <WidgetConfigModal
    v-if="WidgetConfigModal"
    :show="!!configWidgetId"
    :title="manifest?.name || 'Widget'"
    :description="manifest?.description || ''"
    :config-component="ConfigComp"
    :cross-app="!!manifest?.crossApp"
    :blacklist="manifest?.crossAppBlacklist || []"
    v-model:config="config"
    v-model:visibility="visibility"
    @save="save"
    @cancel="closeConfig"
  />
</template>
