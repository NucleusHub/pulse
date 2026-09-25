<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { usePulse } from './composables/usePulse.js'
import { useDashboard, getWidgetWidth } from './composables/useDashboard.js'
import { useAuth } from '@core/auth/useAuth.js'
import { useTheme } from '@core/useTheme.js'
import { useI18n } from '@core/useI18n.js'
import PulseSidebar from './components/PulseSidebar.vue'
import WidgetLibraryModal from './components/WidgetLibraryModal.vue'
import PulseWidgetControls from './components/PulseWidgetControls.vue'
import { Icon } from '@core/icons'
import ChevronRightIcon from './assets/icons/chevron-right.svg?component'
import ChevronLeftIcon from './assets/icons/chevron-left.svg?component'
import DesktopIcon from './assets/icons/desktop.svg?component'

const props = defineProps({
  manifests: { type: Array, default: () => [] },
})

const { closePulse, tempHidden } = usePulse()
const { profile } = useAuth()
const { isDark } = useTheme()
const { t } = useI18n()
const isAdmin = computed(() => profile.value?.role === 'admin')
const { widgets: states } = useDashboard()

const isMobile        = ref(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
const showLibrary     = ref(false)
const sidebarCollapsed = ref(false)

const CONTROLS_H = 34   // approx toolbar height
const TOOLBAR_GAP = 8   // breathing room between the toolbar and its widget

function onKeydown(e) { if (e.key === 'Escape') closePulse() }
function onResize()   { isMobile.value = window.innerWidth < 768; nextTick(measureHeights) }
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onResize)
  nextTick(measureHeights)
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

// Actual rendered heights of the widgets (measured from the DOM), so the
// "below" placement lands under widgets that grow/shrink with size changes
// (e.g. the account widget: small avatar vs. tall large card).
const heights = ref({})
function measureHeights() {
  const next = {}
  for (const w of editableWidgets.value) {
    const el = document.querySelector(`[data-widget-id="${w.id}"]`)
    if (el) next[w.id] = el.offsetHeight
  }
  heights.value = next
}
// Re-measure whenever the set of widgets or any of their sizes change.
watch(
  () => editableWidgets.value.map(w => `${w.id}:${w.size}`).join(','),
  () => nextTick(measureHeights),
  { immediate: true },
)

function anchorTop(w) {
  // Float the toolbar a gap above the widget; if there isn't room above
  // (widget near the top of the viewport), drop it below the widget instead,
  // using the measured height so it clears widgets of any size.
  const aboveTop = w.position.y - TOOLBAR_GAP - CONTROLS_H
  if (aboveTop >= 4) return aboveTop + 'px'
  const h = heights.value[w.id] ?? w.height ?? 48
  return (w.position.y + h + TOOLBAR_GAP) + 'px'
}
</script>

<template>
  <div class="pulse-overlay" :class="{ 'theme-light': !isDark }">
    <!-- Dimming lives in HomeView (below the widget canvas) so the widgets you're
         editing stay bright; this overlay only holds the bright edit chrome. -->

    <!-- Desktop-only elements: edit banner + widget controls -->
    <template v-if="!isMobile">
      <div class="edit-banner" aria-live="polite">
        <span class="edit-dot" />
        {{ t('hub.pulse.editingDashboard') }}
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
          :title="t('hub.pulse.showSidebar')"
          @click="sidebarCollapsed = false">
          <span class="restore-glyph">◈</span>
          <ChevronRightIcon width="11" height="11" />
        </button>
      </Transition>

      <!-- Collapse handle — a bump centered on the sidebar's right border -->
      <Transition name="collapse-tab-fade">
        <button v-if="!sidebarCollapsed"
          class="sidebar-collapse-tab"
          :title="t('hub.pulse.hideSidebar')"
          @click="sidebarCollapsed = true">
          <ChevronLeftIcon width="11" height="11" />
        </button>
      </Transition>
    </template>

    <!-- Mobile: desktop-only notice. Admins still get the admin console here,
         since it's the only Pulse feature usable on a phone. -->
    <div v-else class="mobile-wrap">
      <div class="mobile-notice">
        <button class="notice-close" @click="closePulse">
          <Icon width="15" height="15" name="close" :sw="2.5" />
        </button>
        <DesktopIcon class="notice-icon" />
        <p class="notice-title">{{ t('hub.pulse.desktopOnly') }}</p>
        <p class="notice-body">{{ t('hub.pulse.desktopOnlyBody') }}</p>
      </div>

      <a v-if="isAdmin" class="mobile-admin-btn" href="/admin/">
        <Icon width="16" height="16" name="shield" fill />
        {{ t('core.sidebar.adminConsole') }}
      </a>
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
  z-index: 20;
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

/* ── Collapse handle: a bump on the middle of the sidebar's right border ── */
.sidebar-collapse-tab {
  position: absolute;
  z-index: 20;
  /* sidebar: left 16px + width 220px → sits flush on its right border */
  left: 236px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 52px;
  padding: 0;
  background: rgba(10, 10, 22, 0.92);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: none;
  border-radius: 0 9px 9px 0;
  color: rgba(130, 133, 255, 0.7);
  cursor: pointer;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.35);
  transition: color 0.13s, background 0.13s;
}

.sidebar-collapse-tab:hover {
  background: rgba(20, 20, 45, 0.96);
  color: rgba(130, 133, 255, 1);
}

.collapse-tab-fade-enter-active,
.collapse-tab-fade-leave-active { transition: opacity 0.18s ease; }
.collapse-tab-fade-enter-from,
.collapse-tab-fade-leave-to { opacity: 0; }

/* ── Widget anchors ── */
.widget-anchor {
  position: absolute;
  pointer-events: none;
}
.widget-anchor > * { pointer-events: auto; }

/* ── Mobile desktop-only notice ── */
.mobile-wrap {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(320px, calc(100vw - 48px));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  pointer-events: auto;
}
.mobile-notice {
  position: relative;
  padding: 32px 24px 28px;
  background: rgba(10, 10, 22, 0.96);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  color: #fff;
}
.mobile-admin-btn {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 11px 22px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 600;
  text-decoration: none;
  color: #fff;
  background: rgba(10, 10, 22, 0.96);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(130, 133, 255, 0.4);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  transition: border-color 0.13s, background 0.13s;
}
.mobile-admin-btn svg { color: rgba(130, 133, 255, 0.95); }
.mobile-admin-btn:active {
  background: rgba(20, 20, 45, 0.98);
  border-color: rgba(130, 133, 255, 0.7);
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

/* ── Light mode (theme-light class set from useTheme) ────────────────────── */
.theme-light .sidebar-restore-tab,
.theme-light .sidebar-collapse-tab {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(15, 23, 42, 0.1);
  color: rgba(79, 70, 229, 0.85);
}
.theme-light .sidebar-restore-tab { box-shadow: 0 4px 20px rgba(15, 23, 42, 0.15); }
.theme-light .sidebar-collapse-tab { box-shadow: 4px 0 16px rgba(15, 23, 42, 0.12); }
.theme-light .sidebar-restore-tab:hover,
.theme-light .sidebar-collapse-tab:hover {
  background: rgba(255, 255, 255, 0.99);
  color: rgba(79, 70, 229, 1);
}
</style>
