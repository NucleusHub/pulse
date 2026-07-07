import mongoose from 'mongoose'

const widgetStateSchema = new mongoose.Schema({
  id:      { type: String, required: true },
  enabled: { type: Boolean, default: true },
  locked:  { type: Boolean, default: false },
  position: {
    x: { type: Number, default: 20 },
    y: { type: Number, default: 20 },
  },
  size:   { type: String, default: 'medium' },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  // Per-app override positions when the widget is floated inside another app,
  // keyed by app id: { orbit: { x, y }, echo: { x, y } }. `position` above stays
  // the hub-dashboard position; each app remembers its own placement. Written by
  // widgets/core/components/WidgetOverlayHost.vue.
  appPositions: { type: mongoose.Schema.Types.Mixed, default: {} },
  // Where this widget is shown. 'dashboard' = the hub dashboard only (default);
  // 'apps' = the dashboard PLUS the apps listed in `apps` (app ids, e.g.
  // 'orbit'). The whole widget system is Pulse-owned, so this is stored here in
  // Pulse state rather than a platform-wide store. Rendered cross-app by
  // widgets/core/components/WidgetOverlayHost.vue, gated on Pulse being present.
  visibility: {
    scope: { type: String, enum: ['dashboard', 'apps'], default: 'dashboard' },
    apps:  { type: [String], default: [] },
  },
}, { _id: false })

const dashboardSchema = new mongoose.Schema({
  userId:  { type: String, required: true, unique: true },
  widgets: [widgetStateSchema],
}, { timestamps: true })

export default mongoose.model('Dashboard', dashboardSchema)
