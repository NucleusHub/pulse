import express from 'express'
import Dashboard from '../models/Dashboard.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = String(req.profile.profileId)
    const doc = await Dashboard.findOne({ userId }).lean()
    res.json(doc ?? { userId, widgets: [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/', requireAuth, async (req, res) => {
  try {
    const userId = String(req.profile.profileId)
    const { widgets } = req.body
    const doc = await Dashboard.findOneAndUpdate(
      { userId },
      { widgets },
      { upsert: true, new: true, runValidators: true }
    )
    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
