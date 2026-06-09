<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePulse } from './composables/usePulse.js'
import { useDashboard, getWidgetWidth } from './composables/useDashboard.js'
import PulseSidebar from './components/PulseSidebar.vue'
import WidgetLibraryModal from './components/WidgetLibraryModal.vue'
import PulseWidgetControls from './components/PulseWidgetControls.vue'

const props = defineProps({
  manifests: { type: Array, default: () => [] },
})

const { closePulse } = usePulse()
const { widgets: states } = useDashboard()

function onKeydown(e) { if (e.key === 'Escape') closePulse() }
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

const showLibrary = ref(false)

// Controls float above each widget by this many pixels
const CONTROLS_H = 34

// Exclude fully-locked system modules (core); keep dashboard + system-hub widgets
const dashboardManifests = computed(() =>
  props.manifests.filter(m => m.slot !== 'system')
)

// Merge manifest metadata with live dashboard state for enabled widgets
const editableWidgets = computed(() =>
  dashboardManifests.value
    .map(m => {
      const s = states.value.find(s => s.id === m.id)
      return s
        ? { ...m, ...s }
        : { ...m, enabled: m.enabled !== false, locked: !!m.locked, position: { x: 20, y: 20 }, size: m.defaultSize ?? 'medium', config: {} }
    })
    .filter(w => w.enabled)
)
</script>

<template>
  <!-- Full-screen fixed overlay. pointer-events:none by default — only controls are interactive -->
  <div class="pulse-overlay">

    <!-- Subtle editing mode backdrop -->
    <div class="pulse-backdrop" />

    <!-- Floating "editing" indicator -->
    <div class="edit-banner" aria-live="polite">
      <span class="edit-dot" />
      Editing dashboard
    </div>

    <!-- Widget editing controls — floated above each enabled widget -->
    <div
      v-for="w in editableWidgets"
      :key="w.id"
      class="widget-anchor"
      :style="{
        left:  w.position.x + 'px',
        top:   (w.position.y - CONTROLS_H) + 'px',
        width: getWidgetWidth(w, w.size) + 'px',
      }"
    >
      <PulseWidgetControls :widget="w" />
    </div>

    <!-- Sidebar -->
    <PulseSidebar
      :manifests="props.manifests"
      @close="closePulse"
      @open-library="showLibrary = true"
    />

    <!-- Widget library modal -->
    <WidgetLibraryModal
      v-if="showLibrary"
      :manifests="dashboardManifests"
      @close="showLibrary = false"
    />
  </div>
</template>

<style scoped>
.pulse-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
}

/* Everything inside is non-interactive by default except explicit children */
.pulse-overlay > * {
  pointer-events: auto;
}

.pulse-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 8, 0.22);
  pointer-events: none;
}

.edit-banner {
  position: fixed;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 14px;
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.28);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(130, 133, 255, 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.15);
}

.edit-dot {
  width: 6px;
  height: 6px;
  background: rgba(130, 133, 255, 0.85);
  border-radius: 50%;
  animation: blink 1.6s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

.widget-anchor {
  position: absolute;
  pointer-events: none;
}

.widget-anchor > * {
  pointer-events: auto;
}
</style>
