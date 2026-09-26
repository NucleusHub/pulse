import { ref, computed } from 'vue'

const PULSE_API = '/api/pulse/dashboard'
const SNAP_THRESHOLD = 15

export const SIZE_DIMS = { small: 280, medium: 360, large: 480 }

export function getWidgetWidth(widget, size) {
  const s = size ?? widget.size ?? 'medium'
  return widget.sizeDims?.[s] ?? SIZE_DIMS[s] ?? 360
}

const state = ref(null)
const loading = ref(false)
const error = ref(null)
let initialized = false

async function saveState() {
  if (!state.value) return
  try {
    await fetch(PULSE_API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgets: state.value.widgets }),
    })
  } catch (e) {
    console.error('[Pulse] Failed to save state:', e)
  }
}

// Never clamp or persist from the mobile layout, and never move locked widgets.
const MOBILE_BREAKPOINT = 768
let _clampTimer = null
function clampToViewport() {
  if (!state.value) return
  if (window.innerWidth < MOBILE_BREAKPOINT) return
  const vw = window.innerWidth
  const vh = window.innerHeight
  let moved = false
  for (const w of state.value.widgets) {
    if (!w.position || w.locked) continue
    const ww = getWidgetWidth(w, w.size)
    const nx = Math.max(0, Math.min(w.position.x, vw - ww))
    const ny = Math.max(0, Math.min(w.position.y, vh - 60))
    if (nx !== w.position.x || ny !== w.position.y) {
      w.position.x = nx
      w.position.y = ny
      moved = true
    }
  }
  if (moved) {
    clearTimeout(_clampTimer)
    _clampTimer = setTimeout(saveState, 1200)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', clampToViewport)
}

export function useDashboard() {
  async function fetchState() {
    if (initialized) return
    initialized = true
    loading.value = true
    try {
      const res = await fetch(PULSE_API)
      state.value = await res.json()
    } catch (err) {
      error.value = err.message
      state.value = { userId: 'default', widgets: [] }
    } finally {
      loading.value = false
    }
  }

  function getWidgetState(id) {
    return state.value?.widgets.find(w => w.id === id) ?? null
  }

  function setWidgetState(id, patch) {
    if (!state.value) return
    const idx = state.value.widgets.findIndex(w => w.id === id)
    if (idx >= 0) {
      state.value.widgets[idx] = { ...state.value.widgets[idx], ...patch }
    } else {
      state.value.widgets.push({
        id,
        enabled: true,
        locked: false,
        position: { x: 20, y: 20 },
        size: 'medium',
        config: {},
        visibility: { scope: 'dashboard', apps: [] },
        ...patch,
      })
    }
  }

  function defaultPosition(m, stackOffset) {
    const vw = typeof window !== 'undefined' ? window.innerWidth  : 1280
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768

    if (m.id === 'hub-account') return { x: 16, y: 16 }
    if (m.id === 'hub-theme') {
      const w = m.sizeDims?.small ?? 114
      return { x: Math.max(0, vw - w - 16), y: 16 }
    }
    if (m.id === 'hub-apps') {
      const w = m.sizeDims?.medium ?? 340
      return { x: Math.max(16, Math.round((vw - w) / 2)), y: Math.max(60, Math.round((vh - 280) / 2)) }
    }
    const w = getWidgetWidth(m, m.defaultSize)
    return {
      x: Math.max(16, vw - w - 20),
      y: Math.max(16, vh - 220 - stackOffset * 220),
    }
  }

  function ensureWidgets(manifests) {
    if (!state.value) return
    let stackOffset = state.value.widgets.filter(w => w.enabled).length
    for (const m of manifests) {
      if (state.value.widgets.find(w => w.id === m.id)) continue
      state.value.widgets.push({
        id:       m.id,
        enabled:  m.enabled !== false,
        locked:   !!m.locked,
        position: defaultPosition(m, stackOffset),
        size:     m.defaultSize ?? m.sizes?.[0] ?? 'medium',
        config:   {},
        visibility: { scope: 'dashboard', apps: [] },
      })
      stackOffset++
    }
  }

  function snapPosition(x, y, excludeId, size, overrideWidth) {
    const w = overrideWidth ?? SIZE_DIMS[size] ?? 360
    let sx = x
    let sy = y
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280

    if (Math.abs(sx) < SNAP_THRESHOLD)           sx = 0
    if (Math.abs(sy) < SNAP_THRESHOLD)           sy = 0
    if (Math.abs(sx + w - vw) < SNAP_THRESHOLD)  sx = vw - w

    for (const other of (state.value?.widgets ?? [])) {
      if (other.id === excludeId || !other.enabled) continue
      const ow = other.sizeDims?.[other.size] ?? SIZE_DIMS[other.size] ?? 360
      const ox = other.position.x
      const oy = other.position.y

      if (Math.abs(sx - ox) < SNAP_THRESHOLD)             sx = ox
      if (Math.abs(sx + w - (ox + ow)) < SNAP_THRESHOLD)  sx = ox + ow - w
      if (Math.abs(sx - (ox + ow)) < SNAP_THRESHOLD)      sx = ox + ow
      if (Math.abs(sx + w - ox) < SNAP_THRESHOLD)         sx = ox - w
      if (Math.abs(sy - oy) < SNAP_THRESHOLD)             sy = oy
    }

    return { x: Math.max(0, sx), y: Math.max(0, sy) }
  }

  const widgets = computed(() => state.value?.widgets ?? [])

  return {
    widgets,
    loading,
    error,
    fetchState,
    saveState,
    getWidgetState,
    setWidgetState,
    ensureWidgets,
    snapPosition,
  }
}
