import { ref } from 'vue'

const pulseActive = ref(false)

const configWidgetId = ref(null)

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
