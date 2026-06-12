import { ref } from 'vue'

const pulseActive = ref(false)

// Id of the widget whose config modal is currently open (null = none). The
// modal itself is rendered by the host app (the hub) since it resolves each
// widget's Config.vue; Pulse just tracks which widget asked to be configured.
const configWidgetId = ref(null)

// Widgets hidden for the current Pulse session only. This is NOT "disable":
// it never persists and is cleared the moment Pulse closes, so every widget
// reappears once you leave edit mode. Purely to declutter a busy canvas while
// editing. Restore from the Pulse sidebar within the same session.
const tempHidden = ref(new Set())

function clearTempHidden() {
  if (tempHidden.value.size) tempHidden.value = new Set()
}

export function usePulse() {
  return {
    pulseActive,
    configWidgetId,
    openConfig:  (id) => { configWidgetId.value = id },
    closeConfig: () => { configWidgetId.value = null },
    tempHidden,
    tempHide(id) {
      tempHidden.value = new Set([...tempHidden.value, id])
    },
    tempShow(id) {
      const s = new Set(tempHidden.value)
      s.delete(id)
      tempHidden.value = s
    },
    isTempHidden: (id) => tempHidden.value.has(id),
    openPulse:   () => { pulseActive.value = true },
    closePulse:  () => { pulseActive.value = false; clearTempHidden(); configWidgetId.value = null },
    togglePulse: () => {
      pulseActive.value = !pulseActive.value
      if (!pulseActive.value) { clearTempHidden(); configWidgetId.value = null }
    },
  }
}
