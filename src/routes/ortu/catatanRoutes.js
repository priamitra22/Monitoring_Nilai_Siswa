import { Router } from 'express'
import { authMiddleware } from '../../middlewares/authMiddleware.js'
import {
  getStatistik,
  getCatatanList,
  getCatatanDetail,
  addCatatanReply,
} from '../../controllers/ortu/catatanController.js'

const router = Router()

router.use(authMiddleware)

router.get('/statistik', getStatistik)

router.post('/:id/reply', addCatatanReply)

router.get('/:id', getCatatanDetail)

router.get('/', getCatatanList)

export default router
