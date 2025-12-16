import { Router } from 'express'
import { authMiddleware } from '../../middlewares/authMiddleware.js'
import {
  getConversations,
  getMessages,
  sendMessage,
  getGuruList,
  createConversation,
  getTahunAjaranList,
  getSemesterList,
} from '../../controllers/ortu/chatController.js'

const router = Router()

router.use(authMiddleware)

router.get('/tahun-ajaran', getTahunAjaranList)

router.get('/semester', getSemesterList)

router.get('/conversations', getConversations)

router.post('/conversations', createConversation)

router.get('/conversations/:id/messages', getMessages)

router.post('/conversations/:id/messages', sendMessage)

router.get('/guru-list', getGuruList)

export default router
