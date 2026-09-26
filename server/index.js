import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import dashboardRouter from './routes/dashboard.js'
import { requireAppEnabled } from './core/server/appAccess.js'

const app = express()
const PORT = process.env.PORT || 3004
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nucleus'

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use('/api/pulse', requireAppEnabled('pulse'))
app.use('/api/pulse/dashboard', dashboardRouter)
app.get('/health', (_, res) => res.json({ ok: true }))

mongoose
  .connect(MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`Pulse listening on :${PORT}`)))
  .catch(err => { console.error('MongoDB connection failed:', err); process.exit(1) })
