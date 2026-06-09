import { ref, computed } from 'vue'

const PULSE_API = '/api/pulse/dashboard'
const SNAP_THRESHOLD = 15

export const SIZE_DIMS = { small: 280, medium: 360, large: 480 }

// Module-level singleton — all callers share the same reactive state
const state = ref(null)
const loading = ref(false)
const error = ref(null)
let initialized = false

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
        ...patch,
      })
    }
  }

  // Seeds default state for any widget not yet tracked. Does NOT save to DB.
  function ensureWidgets(manifests) {
    if (!state.value) return
    let stackOffset = state.value.widgets.filter(w => w.enabled).length
    for (const m of manifests) {
      if (state.value.widgets.find(w => w.id === m.id)) continue
      const w = SIZE_DIMS[m.defaultSize ?? 'medium'] ?? 360
      const vw = typeof window !== 'undefined' ? window.innerWidth  : 1280
      const vh = typeof window !== 'undefined' ? window.innerHeight : 768
      state.value.widgets.push({
        id:       m.id,
        enabled:  m.enabled !== false,
        locked:   !!m.locked,
        position: {
          x: Math.max(16, vw - w - 20),
          y: Math.max(16, vh - 220 - stackOffset * 220),
        },
        size:   m.defaultSize ?? m.sizes?.[0] ?? 'medium',
        config: {},
      })
      stackOffset++
    }
  }

  function snapPosition(x, y, excludeId, size) {
    const w = SIZE_DIMS[size] ?? 360
    let sx = x
    let sy = y
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280

    // Snap to viewport left/top/right
    if (Math.abs(sx) < SNAP_THRESHOLD)           sx = 0
    if (Math.abs(sy) < SNAP_THRESHOLD)           sy = 0
    if (Math.abs(sx + w - vw) < SNAP_THRESHOLD)  sx = vw - w

    for (const other of (state.value?.widgets ?? [])) {
      if (other.id === excludeId || !other.enabled) continue
      const ow = SIZE_DIMS[other.size] ?? 360
      const ox = other.position.x
      const oy = other.position.y

      // Horizontal alignment
      if (Math.abs(sx - ox) < SNAP_THRESHOLD)           sx = ox
      if (Math.abs(sx + w - (ox + ow)) < SNAP_THRESHOLD) sx = ox + ow - w
      if (Math.abs(sx - (ox + ow)) < SNAP_THRESHOLD)     sx = ox + ow
      if (Math.abs(sx + w - ox) < SNAP_THRESHOLD)        sx = ox - w
      // Vertical alignment
      if (Math.abs(sy - oy) < SNAP_THRESHOLD)            sy = oy
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
