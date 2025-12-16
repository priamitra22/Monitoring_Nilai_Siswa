import { Router } from 'express'
import { authMiddleware } from '../../middlewares/authMiddleware.js'
import {
  getTahunAjaran,
  getSemester,
  getNilaiDetail,
} from '../../controllers/ortu/nilaiController.js'

const router = Router()

router.use(authMiddleware)

router.get('/tahun-ajaran', getTahunAjaran)

router.get('/semester', getSemester)

router.get('/', getNilaiDetail)

export default router
