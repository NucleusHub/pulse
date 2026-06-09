import { ref } from 'vue'

const pulseActive = ref(false)

export function usePulse() {
  return {
    pulseActive,
    openPulse:   () => { pulseActive.value = true },
    closePulse:  () => { pulseActive.value = false },
    togglePulse: () => { pulseActive.value = !pulseActive.value },
  }
}
