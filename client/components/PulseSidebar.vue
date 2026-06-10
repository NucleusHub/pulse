<script setup>
import { computed } from 'vue'
import { useDashboard } from '../composables/useDashboard.js'

const props = defineProps({
  manifests: { type: Array, default: () => [] },
  inline: { type: Boolean, default: false },
  collapsed: { type: Boolean, default: false },
})

defineEmits(['close', 'open-library', 'collapse'])

const { widgets: states, getWidgetState, saveState } = useDashboard()

const allMerged = computed(() =>
  props.manifests.map(m => {
    const s = states.value.find(s => s.id === m.id)
    return s ? { ...m, ...s } : { ...m, enabled: m.enabled !== false, locked: !!m.locked }
  })
)

const userWidgets = computed(() =>
  allMerged.value.filter(w => w.slot !== 'system' && w.slot !== 'system-hub')
)

const systemWidgets = computed(() =>
  allMerged.value.filter(w => w.slot === 'system' || w.slot === 'system-hub')
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
</script>

<template>
  <aside class="sidebar" :class="{ 'is-inline': inline, 'is-collapsed': collapsed && !inline }">
    <div class="sidebar-header">
      <div class="sidebar-title">
        <span class="pulse-glyph">◈</span>
        Pulse
      </div>
      <div v-if="!inline" style="display:flex;gap:4px">
        <button class="icon-btn" title="Hide sidebar" @click="$emit('collapse')">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
          </svg>
        </button>
        <button class="icon-btn" title="Close Pulse" @click="$emit('close')">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <p class="hint">Drag widgets to reposition. Click + Add Widget to install more.</p>

    <div class="section-label">Installed Widgets</div>

    <ul class="widget-list">
      <li
        v-for="w in userWidgets"
        :key="w.id"
        class="widget-item"
        :class="{ 'is-disabled': !w.enabled }"
      >
        <div class="widget-meta">
          <span class="widget-name">{{ w.name }}</span>
        </div>
        <div class="widget-actions">
          <button v-if="!w.enabled" class="toggle-btn enable" @click="enableWidget(w.id)">Enable</button>
          <button v-else class="toggle-btn disable" @click="disableWidget(w.id)">Disable</button>
        </div>
      </li>

      <li v-if="userWidgets.length === 0" class="empty-hint">No widgets installed.</li>
    </ul>

    <div class="section-label system-section-label">System</div>

    <ul class="widget-list">
      <li
        v-for="w in systemWidgets"
        :key="w.id"
        class="widget-item system-item"
      >
        <div class="widget-meta">
          <span class="widget-name">{{ w.name }}</span>
          <span class="system-badge">🔒 Required</span>
        </div>
      </li>
    </ul>

    <div class="sidebar-footer">
      <button class="add-btn" @click="$emit('open-library')">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M12 4v16m-8-8h16"/>
        </svg>
        Add Widget
      </button>
    </div>
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

.system-section-label {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  margin-top: 4px;
}

.system-item {
  opacity: 0.6;
}

.system-item:hover {
  background: transparent;
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

.widget-actions { flex-shrink: 0; }

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
