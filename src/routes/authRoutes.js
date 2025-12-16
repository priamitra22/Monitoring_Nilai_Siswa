import express from 'express'
import { login, getProfile, changeDefaultPassword } from '../controllers/authController.js'
import { authMiddleware, tempAuthMiddleware } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post('/login', login)
router.get('/me', authMiddleware, getProfile)

router.post('/change-default-password', tempAuthMiddleware, changeDefaultPassword)

export default router
