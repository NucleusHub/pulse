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
}, { _id: false })

const dashboardSchema = new mongoose.Schema({
  userId:  { type: String, required: true, unique: true },
  widgets: [widgetStateSchema],
}, { timestamps: true })

export default mongoose.model('Dashboard', dashboardSchema)
