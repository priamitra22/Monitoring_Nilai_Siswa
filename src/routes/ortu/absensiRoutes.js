import { Router } from 'express'
import { authMiddleware } from '../../middlewares/authMiddleware.js'
import {
  getTahunAjaran,
  getSemester,
  getBulan,
  getSummary,
  getDetail,
} from '../../controllers/ortu/absensiController.js'

const router = Router()

router.use(authMiddleware)

router.get('/tahun-ajaran', getTahunAjaran)

router.get('/semester', getSemester)

router.get('/bulan', getBulan)

router.get('/summary', getSummary)

router.get('/detail', getDetail)

export default router
