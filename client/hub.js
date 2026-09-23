// Pulse's hub extension — makes Pulse the hub's dashboard provider. The hub
// globs `hub/libs/<appId>/hub.js` out of its hub libraries (apps whose client/
// has no vite.config, linked into the hub by infra/tool) and falls back to a static
// layout when none is installed. See hub/src/composables/useDashboardProvider.js
// for the contract; this file only adapts Pulse's composables to it.
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
