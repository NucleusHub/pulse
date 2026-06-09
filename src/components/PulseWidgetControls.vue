<script setup>
import { ref } from 'vue'
import { useDashboard } from '../composables/useDashboard.js'

const props = defineProps({
  widget: { type: Object, required: true },
})

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
  const { x, y } = snapPosition(rawX, rawY, props.widget.id, props.widget.size)
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
  <div class="controls-root" :class="{ dragging: isDragging }">
    <div class="controls-bar">
      <!-- Drag handle -->
      <button
        class="ctrl-btn drag-handle"
        :class="{ 'is-locked': widget.locked }"
        :title="widget.locked ? 'Unlock to move' : 'Drag to reposition'"
        @mousedown="startDrag"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9"  cy="5"  r="2"/><circle cx="15" cy="5"  r="2"/>
          <circle cx="9"  cy="12" r="2"/><circle cx="15" cy="12" r="2"/>
          <circle cx="9"  cy="19" r="2"/><circle cx="15" cy="19" r="2"/>
        </svg>
      </button>

      <div class="divider" />

      <!-- Size presets (only shown when widget declares multiple sizes) -->
      <template v-if="widget.sizes && widget.sizes.length > 1">
        <button
          v-for="s in widget.sizes"
          :key="s"
          class="ctrl-btn size-btn"
          :class="{ active: widget.size === s }"
          :title="s.charAt(0).toUpperCase() + s.slice(1)"
          @click="setSize(s)"
        >{{ s.charAt(0).toUpperCase() }}</button>
        <div class="divider" />
      </template>

      <!-- Configure (only when widget declares it) -->
      <button v-if="widget.configurable" class="ctrl-btn" title="Configure">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>

      <!-- Lock toggle -->
      <button
        class="ctrl-btn"
        :class="{ 'lock-active': widget.locked }"
        :title="widget.locked ? 'Unlock position' : 'Lock position'"
        @click="toggleLock"
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="5" y="11" width="14" height="10" rx="2"/>
          <path v-if="widget.locked"  stroke-linecap="round" d="M8 11V7a4 4 0 0 1 8 0v4"/>
          <path v-else stroke-linecap="round" stroke-dasharray="2 2" d="M8 11V7a4 4 0 0 1 8 0"/>
        </svg>
      </button>

      <div class="divider" />

      <!-- Disable -->
      <button class="ctrl-btn disable-btn" @click="disableWidget">Disable</button>
    </div>
  </div>
</template>

<style scoped>
.controls-root {
  position: relative;
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
  -webkit-backdrop-filter: blur(14px);
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
</style>
