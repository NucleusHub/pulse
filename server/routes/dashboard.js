import express from 'express'
import Dashboard from '../models/Dashboard.js'

const router = express.Router()
const USER_ID = 'default'

router.get('/', async (_, res) => {
  try {
    const doc = await Dashboard.findOne({ userId: USER_ID }).lean()
    res.json(doc ?? { userId: USER_ID, widgets: [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/', async (req, res) => {
  try {
    const { widgets } = req.body
    const doc = await Dashboard.findOneAndUpdate(
      { userId: USER_ID },
      { widgets },
      { upsert: true, new: true, runValidators: true }
    )
    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
