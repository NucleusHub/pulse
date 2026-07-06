<script setup>
import { computed } from 'vue'
import { useDashboard } from '../composables/useDashboard.js'
import { formatVersion } from '@core/version.js'
import { useI18n } from '@core/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  manifests: { type: Array, default: () => [] },
})

defineEmits(['close'])

const { widgets: states, getWidgetState, setWidgetState, saveState } = useDashboard()

const libraryWidgets = computed(() =>
  props.manifests
    .filter(m => !m.locked && m.slot !== 'system')
    .map(m => {
      const s = states.value.find(s => s.id === m.id)
      return { ...m, isEnabled: s ? s.enabled !== false : m.enabled !== false }
    })
)

function addWidget(manifest) {
  const existing = getWidgetState(manifest.id)
  if (existing) {
    existing.enabled = true
  } else {
    setWidgetState(manifest.id, {
      enabled: true,
      size: manifest.defaultSize ?? manifest.sizes?.[0] ?? 'medium',
      position: { x: 80, y: 80 },
    })
  }
  saveState()
}
</script>

<template>
  <div class="backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">{{ t('hub.pulse.addWidget') }}</h2>
        <button class="icon-btn" @click="$emit('close')">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <p class="modal-hint">{{ t('hub.pulse.autoDiscovered') }}</p>

      <div class="widget-list">
        <div v-for="w in libraryWidgets" :key="w.id" class="widget-card">
          <div class="widget-info">
            <div class="widget-name-row">
              <p class="widget-name">{{ w.name }}</p>
              <span v-if="w.version" class="widget-version">{{ formatVersion(w.version) }}</span>
            </div>
            <p class="widget-desc">{{ w.description }}</p>
          </div>
          <button v-if="!w.isEnabled" class="add-btn" @click="addWidget(w); $emit('close')">{{ t('hub.pulse.add') }}</button>
          <span v-else class="added-label">{{ t('hub.pulse.active') }}</span>
        </div>

        <p v-if="libraryWidgets.length === 0" class="empty">
          {{ t('hub.pulse.noAdditional') }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  background: rgba(12, 12, 26, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 20px;
  padding: 20px;
  width: 400px;
  max-width: 90vw;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  color: #fff;
  box-shadow: 0 16px 60px rgba(0, 0, 0, 0.6);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.icon-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 7px;
  color: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.modal-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  margin: 0 0 14px;
}

.widget-list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.widget-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 13px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  transition: background 0.12s;
}

.widget-card:hover {
  background: rgba(255, 255, 255, 0.07);
}

.widget-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 2px;
}

.widget-name {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

.widget-version {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 6px;
  border-radius: 6px;
  white-space: nowrap;
}

.widget-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

.add-btn {
  padding: 5px 14px;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 7px;
  color: rgba(130, 133, 255, 1);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.12s;
}

.add-btn:hover {
  background: rgba(99, 102, 241, 0.35);
}

.added-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.28);
  padding: 5px 10px;
  flex-shrink: 0;
}

.empty {
  text-align: center;
  padding: 24px;
  color: rgba(255, 255, 255, 0.28);
  font-size: 13px;
  margin: 0;
}
</style>
