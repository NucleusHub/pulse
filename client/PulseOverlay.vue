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

const { closePulse, tempHidden } = usePulse()
const { widgets: states } = useDashboard()

const isMobile        = ref(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
const showLibrary     = ref(false)
const sidebarCollapsed = ref(false)

const CONTROLS_H = 34

function onKeydown(e) { if (e.key === 'Escape') closePulse() }
function onResize()   { isMobile.value = window.innerWidth < 768 }
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onResize)
})

const dashboardManifests = computed(() =>
  props.manifests.filter(m => m.slot !== 'system')
)

const editableWidgets = computed(() =>
  dashboardManifests.value
    .filter(m => m.overlayControls !== false && m.slot !== 'nucleus')
    .map(m => {
      const s = states.value.find(s => s.id === m.id)
      return s
        ? { ...m, ...s }
        : { ...m, enabled: m.enabled !== false, locked: !!m.locked, position: { x: 20, y: 20 }, size: m.defaultSize ?? 'medium', config: {} }
    })
    .filter(w => w.enabled && !tempHidden.value.has(w.id))
)

function anchorTop(w) {
  return (w.position.y < CONTROLS_H
    ? w.position.y + (w.height ?? 48)
    : w.position.y - CONTROLS_H) + 'px'
}
</script>

<template>
  <div class="pulse-overlay">
    <div class="pulse-backdrop" />

    <!-- Desktop-only elements: edit banner + widget controls -->
    <template v-if="!isMobile">
      <div class="edit-banner" aria-live="polite">
        <span class="edit-dot" />
        Editing dashboard
      </div>

      <div
        v-for="w in editableWidgets"
        :key="w.id"
        class="widget-anchor"
        :style="{
          left:  w.position.x + 'px',
          top:   anchorTop(w),
          width: getWidgetWidth(w, w.size) + 'px',
        }"
      >
        <PulseWidgetControls :widget="w" />
      </div>
    </template>

    <!-- Desktop sidebar + widget controls -->
    <template v-if="!isMobile">
      <PulseSidebar
        :manifests="props.manifests"
        :collapsed="sidebarCollapsed"
        @close="closePulse"
        @open-library="showLibrary = true"
        @collapse="sidebarCollapsed = true"
      />
      <Transition name="tab-slide">
        <button v-if="sidebarCollapsed"
          class="sidebar-restore-tab"
          title="Show sidebar"
          @click="sidebarCollapsed = false">
          <span class="restore-glyph">◈</span>
          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
          </svg>
        </button>
      </Transition>
    </template>

    <!-- Mobile: desktop-only notice -->
    <div v-else class="mobile-notice">
      <button class="notice-close" @click="closePulse">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <svg class="notice-icon" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3"
        />
      </svg>
      <p class="notice-title">Desktop only</p>
      <p class="notice-body">Dashboard editing is only available on desktop or tablet.</p>
    </div>

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

.pulse-overlay > * { pointer-events: auto; }

.pulse-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 8, 0.22);
  pointer-events: none;
}

/* ── Desktop edit banner ── */
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
  flex-shrink: 0;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

/* ── Sidebar restore tab ── */
.sidebar-restore-tab {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 32px;
  padding: 14px 0;
  background: rgba(10, 10, 22, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(130, 133, 255, 0.7);
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  transition: color 0.13s, background 0.13s;
}

.sidebar-restore-tab:hover {
  background: rgba(20, 20, 45, 0.96);
  color: rgba(130, 133, 255, 1);
}

.restore-glyph {
  font-size: 14px;
  line-height: 1;
}

.tab-slide-enter-active,
.tab-slide-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.tab-slide-enter-from,
.tab-slide-leave-to { opacity: 0; transform: translateY(-50%) translateX(-12px); }

/* ── Widget anchors ── */
.widget-anchor {
  position: absolute;
  pointer-events: none;
}
.widget-anchor > * { pointer-events: auto; }

/* ── Mobile desktop-only notice ── */
.mobile-notice {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(320px, calc(100vw - 48px));
  padding: 32px 24px 28px;
  background: rgba(10, 10, 22, 0.96);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  pointer-events: auto;
  color: #fff;
}

.notice-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 7px;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.notice-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
}

.notice-icon {
  width: 36px;
  height: 36px;
  color: rgba(130, 133, 255, 0.8);
  margin-bottom: 4px;
}

.notice-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.notice-body {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  line-height: 1.5;
}
</style>
