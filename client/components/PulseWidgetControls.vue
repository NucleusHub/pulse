<script setup>
import { ref, computed } from 'vue'
import { useDashboard } from '../composables/useDashboard.js'
import { usePulse } from '../composables/usePulse.js'
import { useTheme } from '@core/useTheme.js'
import { useI18n } from '@core/useI18n.js'
import GripDotsIcon from '../assets/icons/grip-dots.svg?component'
import SettingsIcon from '../assets/icons/settings.svg?component'
import EyeOffIcon from '../assets/icons/eye-off.svg?component'

const { isDark } = useTheme()
const { t } = useI18n()

const props = defineProps({
  widget: { type: Object, required: true },
})

const emit = defineEmits(['movestart'])

const { openConfig, tempHide } = usePulse()

// Nucleus widgets have no sizes — the bar shows a move handle, name + disable.
// Their dragging is handled by the parent (force layout), via the movestart event.
const minimal = computed(() => props.widget.slot === 'nucleus')

const { getWidgetState, saveState, snapPosition } = useDashboard()

const isDragging = ref(false)
let dragOrigin = { mouseX: 0, mouseY: 0, widgetX: 0, widgetY: 0 }

function startDrag(e) {
  if (props.widget.locked) return
  isDragging.value = true
  dragOrigin = {
    mouseX: e.clientX,
    mouseY: e.clientY,
    widgetX: props.widget.position.x,
    widgetY: props.widget.position.y,
  }
  window.addEventListener('mousemove', duringDrag)
  window.addEventListener('mouseup', endDrag)
  e.preventDefault()
}

function duringDrag(e) {
  const rawX = dragOrigin.widgetX + e.clientX - dragOrigin.mouseX
  const rawY = dragOrigin.widgetY + e.clientY - dragOrigin.mouseY
  const thisWidth = props.widget.sizeDims?.[props.widget.size] ?? undefined
  const { x, y } = snapPosition(rawX, rawY, props.widget.id, props.widget.size, thisWidth)
  const ws = getWidgetState(props.widget.id)
  if (ws) {
    ws.position.x = x
    ws.position.y = y
  }
}

function endDrag() {
  isDragging.value = false
  window.removeEventListener('mousemove', duringDrag)
  window.removeEventListener('mouseup', endDrag)
  saveState()
}

function setSize(size) {
  const ws = getWidgetState(props.widget.id)
  if (ws) ws.size = size
  saveState()
}

function toggleLock() {
  const ws = getWidgetState(props.widget.id)
  if (ws) ws.locked = !ws.locked
  saveState()
}

function disableWidget() {
  const ws = getWidgetState(props.widget.id)
  if (ws) ws.enabled = false
  saveState()
}
</script>

<template>
  <div class="controls-root" :class="{ dragging: isDragging, 'theme-light': !isDark }">
    <!-- Minimal bar for nucleus widgets: move handle + name + lock + disable -->
    <div v-if="minimal" class="controls-bar">
      <button
        class="ctrl-btn drag-handle"
        :class="{ 'is-locked': widget.locked }"
        :title="widget.locked ? t('hub.pulse.unlockToMove') : t('hub.pulse.dragToMove')"
        @mousedown="!widget.locked && emit('movestart', $event)"
      >
        <GripDotsIcon width="12" height="12" />
      </button>
      <div class="divider" />
      <span class="ctrl-name">{{ widget.name }}</span>
      <div class="divider" />
      <button
        class="ctrl-btn"
        :class="{ 'lock-active': widget.locked }"
        :title="widget.locked ? t('hub.pulse.unlockPosition') : t('hub.pulse.lockPosition')"
        @click="toggleLock"
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="5" y="11" width="14" height="10" rx="2"/>
          <path v-if="widget.locked"  stroke-linecap="round" d="M8 11V7a4 4 0 0 1 8 0v4"/>
          <path v-else stroke-linecap="round" stroke-dasharray="2 2" d="M8 11V7a4 4 0 0 1 8 0"/>
        </svg>
      </button>
      <div class="divider" />
      <button class="ctrl-btn disable-btn" @click="disableWidget">{{ t('hub.pulse.disable') }}</button>
    </div>

    <div v-else class="controls-bar">
      <!-- Drag handle -->
      <button
        class="ctrl-btn drag-handle"
        :class="{ 'is-locked': widget.locked }"
        :title="widget.locked ? t('hub.pulse.unlockToMove') : t('hub.pulse.dragToReposition')"
        @mousedown="startDrag"
      >
        <GripDotsIcon width="12" height="12" />
      </button>

      <div class="divider" />

      <!-- Size presets (only shown when widget declares multiple sizes) -->
      <template v-if="widget.sizes && widget.sizes.length > 1">
        <button
          v-for="s in widget.sizes"
          :key="s"
          class="ctrl-btn size-btn"
          :class="{ active: widget.size === s }"
          :title="t('hub.pulse.size' + s.charAt(0).toUpperCase() + s.slice(1))"
          @click="setSize(s)"
        >{{ s.charAt(0).toUpperCase() }}</button>
        <div class="divider" />
      </template>

      <!-- Configure — for widgets with their own settings, or any that can be
           shown in other apps (they need the "Show in" picker). -->
      <button v-if="widget.configurable || widget.crossApp" class="ctrl-btn" :title="t('hub.pulse.configure')" @click="openConfig(widget.id)">
        <SettingsIcon width="13" height="13" />
      </button>

      <!-- Lock toggle -->
      <button
        class="ctrl-btn"
        :class="{ 'lock-active': widget.locked }"
        :title="widget.locked ? t('hub.pulse.unlockPosition') : t('hub.pulse.lockPosition')"
        @click="toggleLock"
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="5" y="11" width="14" height="10" rx="2"/>
          <path v-if="widget.locked"  stroke-linecap="round" d="M8 11V7a4 4 0 0 1 8 0v4"/>
          <path v-else stroke-linecap="round" stroke-dasharray="2 2" d="M8 11V7a4 4 0 0 1 8 0"/>
        </svg>
      </button>

      <template v-if="widget.slot !== 'system-hub'">
        <div class="divider" />
        <button class="ctrl-btn disable-btn" @click="disableWidget">{{ t('hub.pulse.disable') }}</button>
      </template>
    </div>

    <!-- Temp-hide handle on the toolbar's top-right corner -->
    <button class="hide-corner-btn" :title="t('hub.pulse.hideForNow')" @click.stop="tempHide(widget.id)">
      <EyeOffIcon width="11" height="11" />
    </button>
  </div>
</template>

<style scoped>
.controls-root {
  position: relative;
  width: fit-content;   /* shrink to the bar so the hide handle sits on its corner */
}

.controls-root.dragging {
  cursor: grabbing;
  user-select: none;
}

.controls-bar {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  background: rgba(10, 10, 22, 0.88);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.5);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.drag-handle { cursor: grab; }
.drag-handle:active,
.dragging .drag-handle { cursor: grabbing; }

.drag-handle.is-locked {
  opacity: 0.35;
  cursor: not-allowed;
}

.size-btn.active {
  background: rgba(99, 102, 241, 0.5);
  color: #fff;
}

.lock-active {
  color: rgba(251, 191, 36, 0.85);
}

.ctrl-name {
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
}

.disable-btn {
  width: auto;
  padding: 0 9px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
}

.disable-btn:hover {
  background: rgba(239, 68, 68, 0.18);
  color: rgba(239, 68, 68, 0.85);
}

.divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 2px;
  flex-shrink: 0;
}

/* ── Light mode (theme-light class set from useTheme) ────────────────────── */
.theme-light .controls-bar {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(15, 23, 42, 0.12);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.15);
}
.theme-light .ctrl-btn { color: rgba(15, 23, 42, 0.5); }
.theme-light .ctrl-btn:hover { background: rgba(15, 23, 42, 0.08); color: rgba(15, 23, 42, 0.9); }
.theme-light .ctrl-name { color: rgba(15, 23, 42, 0.85); }
.theme-light .disable-btn { color: rgba(15, 23, 42, 0.45); }
.theme-light .disable-btn:hover { background: rgba(239, 68, 68, 0.15); color: rgba(220, 38, 38, 0.95); }
.theme-light .divider { background: rgba(15, 23, 42, 0.12); }
/* Keep the active lock gold in light mode (otherwise the ctrl-btn rule greys it) */
.theme-light .ctrl-btn.lock-active { color: rgba(202, 138, 4, 1); }

/* Temp-hide handle on the toolbar corner */
.hide-corner-btn {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(35%, -35%);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(10, 10, 22, 0.95);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  transition: background 0.12s, color 0.12s, transform 0.12s;
  z-index: 1;
}
.hide-corner-btn:hover {
  background: rgba(20, 20, 45, 0.98);
  color: #fff;
  transform: translate(35%, -35%) scale(1.1);
}
.theme-light .hide-corner-btn {
  background: rgba(255, 255, 255, 0.97);
  border-color: rgba(15, 23, 42, 0.12);
  color: rgba(15, 23, 42, 0.6);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);
}
.theme-light .hide-corner-btn:hover {
  background: #fff;
  color: rgba(15, 23, 42, 0.9);
}
</style>
