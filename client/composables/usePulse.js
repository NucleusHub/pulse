import { ref } from 'vue'

const pulseActive = ref(false)

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
    closePulse:  () => { pulseActive.value = false; clearTempHidden() },
    togglePulse: () => {
      pulseActive.value = !pulseActive.value
      if (!pulseActive.value) clearTempHidden()
    },
  }
}
