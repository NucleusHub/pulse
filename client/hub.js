import { defineAsyncComponent } from 'vue'
import { usePulse } from './composables/usePulse.js'
import { useDashboard, getWidgetWidth } from './composables/useDashboard.js'

export default {
  useEditor() {
    const p = usePulse()
    return {
      active: p.pulseActive,
      toggle: p.togglePulse,
      tempHidden: p.tempHidden,
      isTempHidden: p.isTempHidden,
    }
  },
  useDashboard,
  widgetWidth: getWidgetWidth,
  Overlay: defineAsyncComponent(() => import('./PulseOverlay.vue')),
  WidgetControls: defineAsyncComponent(() => import('./components/PulseWidgetControls.vue')),
  ConfigModal: defineAsyncComponent(() => import('./components/WidgetConfigHost.vue')),
}
