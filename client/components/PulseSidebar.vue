<script setup>
import { computed } from 'vue'
import { useDashboard } from '../composables/useDashboard.js'
import { usePulse } from '../composables/usePulse.js'

const props = defineProps({
  manifests: { type: Array, default: () => [] },
  inline: { type: Boolean, default: false },
  collapsed: { type: Boolean, default: false },
})

defineEmits(['close', 'open-library', 'collapse'])

const { widgets: states, getWidgetState, saveState } = useDashboard()
const { isTempHidden, tempHide, tempShow } = usePulse()

const allMerged = computed(() =>
  props.manifests.map(m => {
    const s = states.value.find(s => s.id === m.id)
    return s ? { ...m, ...s } : { ...m, enabled: m.enabled !== false, locked: !!m.locked }
  })
)

const userWidgets = computed(() =>
  allMerged.value.filter(w => w.slot !== 'system' && w.slot !== 'system-hub')
)
// Enabled widgets up top; disabled ones drop into their own section below.
const enabledUserWidgets  = computed(() => userWidgets.value.filter(w => w.enabled))
const disabledUserWidgets = computed(() => userWidgets.value.filter(w => !w.enabled))

// Required widgets — can't be disabled, but can still be temp-hidden:
// Core plus the hub's own UI (Account / Theme Changer / App Buttons). System
// Info is the background data provider (no UI), so it's excluded from the list.
const systemWidgets = computed(() =>
  allMerged.value.filter(w => (w.slot === 'system' || w.slot === 'system-hub') && w.id !== 'sysinfo')
)

function enableWidget(id) {
  const ws = getWidgetState(id)
  if (ws) ws.enabled = true
  saveState()
}

function disableWidget(id) {
  const ws = getWidgetState(id)
  if (ws) ws.enabled = false
  saveState()
}

// Per-session hide: declutters the canvas while editing. Cleared when Pulse
// closes, so widgets reappear automatically. Core has no UI and App Buttons
// must always stay, so neither can be temp-hidden.
const NO_TEMP_HIDE = new Set(['core', 'hub-apps'])
function canTempHide(w) {
  return w.enabled !== false && !NO_TEMP_HIDE.has(w.id)
}
function toggleTempHide(id) {
  if (isTempHidden(id)) tempShow(id)
  else tempHide(id)
}
</script>

<template>
  <aside class="sidebar" :class="{ 'is-inline': inline, 'is-collapsed': collapsed && !inline }">
    <div class="sidebar-header">
      <div class="sidebar-title">
        <span class="pulse-glyph">◈</span>
        Pulse
      </div>
      <div v-if="!inline" style="display:flex;gap:4px">
        <button class="icon-btn" title="Close Pulse" @click="$emit('close')">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <p class="hint">Drag widgets to reposition.<!-- Click + Add Widget to install more. --></p>

    <div class="section-label">Installed Widgets</div>

    <ul class="widget-list">
      <li
        v-for="w in enabledUserWidgets"
        :key="w.id"
        class="widget-item"
        :class="{ 'is-temp-hidden': isTempHidden(w.id) }"
      >
        <div class="widget-meta">
          <span class="widget-name">{{ w.name }}</span>
          <span v-if="isTempHidden(w.id)" class="temp-badge">Hidden this session</span>
        </div>
        <div class="widget-actions">
          <button
            v-if="canTempHide(w)"
            class="icon-toggle"
            :class="{ active: isTempHidden(w.id) }"
            :title="isTempHidden(w.id) ? 'Show widget' : 'Hide for this session'"
            @click="toggleTempHide(w.id)"
          >
            <svg v-if="isTempHidden(w.id)" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.243 4.243L9.88 9.88" />
            </svg>
            <svg v-else width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
          <button class="toggle-btn disable" @click="disableWidget(w.id)">Disable</button>
        </div>
      </li>

      <li v-if="!userWidgets.length" class="empty-hint">No widgets installed.</li>
      <li v-else-if="!enabledUserWidgets.length" class="empty-hint">No widgets enabled.</li>
    </ul>

    <!-- Disabled widgets — parked below until re-enabled -->
    <template v-if="disabledUserWidgets.length">
      <div class="section-label divider-label">Disabled</div>
      <ul class="widget-list">
        <li
          v-for="w in disabledUserWidgets"
          :key="w.id"
          class="widget-item is-disabled"
        >
          <div class="widget-meta">
            <span class="widget-name">{{ w.name }}</span>
          </div>
          <div class="widget-actions">
            <button class="toggle-btn enable" @click="enableWidget(w.id)">Enable</button>
          </div>
        </li>
      </ul>
    </template>

    <div class="section-label system-section-label">System</div>

    <ul class="widget-list">
      <li
        v-for="w in systemWidgets"
        :key="w.id"
        class="widget-item system-item"
        :class="{ 'is-temp-hidden': isTempHidden(w.id) }"
      >
        <div class="widget-meta">
          <span class="widget-name">{{ w.name }}</span>
          <span v-if="isTempHidden(w.id)" class="temp-badge">Hidden this session</span>
          <span v-else class="system-badge">🔒 Required</span>
        </div>
        <div class="widget-actions">
          <button
            v-if="canTempHide(w)"
            class="icon-toggle"
            :class="{ active: isTempHidden(w.id) }"
            :title="isTempHidden(w.id) ? 'Show widget' : 'Hide for this session'"
            @click="toggleTempHide(w.id)"
          >
            <svg v-if="isTempHidden(w.id)" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.243 4.243L9.88 9.88" />
            </svg>
            <svg v-else width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
        </div>
      </li>

      <li v-if="systemWidgets.length === 0" class="empty-hint">No system widgets.</li>
    </ul>

    <!-- Add Widget button hidden for now — uncomment to restore.
    <div class="sidebar-footer">
      <button class="add-btn" @click="$emit('open-library')">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M12 4v16m-8-8h16"/>
        </svg>
        Add Widget
      </button>
    </div>
    -->
  </aside>
</template>

<style scoped>
.sidebar {
  position: absolute;
  left: 16px;
  top: 16px;
  bottom: 16px;
  width: 220px;
  background: rgba(10, 10, 22, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #fff;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.is-collapsed {
  transform: translateX(calc(-100% - 32px));
}

/* When rendered inside the mobile drawer — no absolute positioning, fills parent */
.sidebar.is-inline {
  position: static;
  width: 100%;
  height: auto;
  border-radius: 0;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: transparent;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.pulse-glyph {
  color: rgba(99, 102, 241, 0.9);
  font-size: 17px;
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
  transition: background 0.13s, color 0.13s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
}

.hint {
  padding: 8px 12px;
  font-size: 11px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  margin: 0;
}

.section-label {
  padding: 10px 12px 5px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(255, 255, 255, 0.25);
  flex-shrink: 0;
}

.widget-list {
  overflow-y: auto;
  padding: 0 6px;
  list-style: none;
  margin: 0;
}

.widget-list:first-of-type {
  flex: 1;
}

.system-section-label,
.divider-label {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  margin-top: 4px;
}

.system-item .widget-name {
  opacity: 0.7;
}

.empty-hint {
  padding: 8px 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.25);
}

.widget-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 8px;
  transition: background 0.12s;
}

.widget-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.widget-item.is-disabled .widget-name {
  opacity: 0.35;
}

.widget-item.is-temp-hidden .widget-name {
  opacity: 0.5;
}

.temp-badge {
  font-size: 10px;
  color: rgba(130, 133, 255, 0.7);
}

.widget-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.widget-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.system-badge {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
}

.widget-actions { flex-shrink: 0; display: flex; align-items: center; gap: 4px; }

.icon-toggle {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.icon-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.icon-toggle.active {
  color: rgba(130, 133, 255, 0.95);
}

.toggle-btn {
  padding: 3px 9px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.12s, color 0.12s;
  white-space: nowrap;
}

.toggle-btn.enable {
  background: rgba(99, 102, 241, 0.2);
  color: rgba(130, 133, 255, 0.95);
}

.toggle-btn.enable:hover {
  background: rgba(99, 102, 241, 0.38);
}

.toggle-btn.disable {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.45);
}

.toggle-btn.disable:hover {
  background: rgba(239, 68, 68, 0.18);
  color: rgba(239, 68, 68, 0.85);
}

.sidebar-footer {
  padding: 8px 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.add-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(130, 133, 255, 0.9);
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.18);
  cursor: pointer;
  transition: background 0.13s, border-color 0.13s;
}

.add-btn:hover {
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.32);
}
</style>
