import { Router } from 'express'
import {
  getLaporanList,
  getKelasOptions,
  downloadLaporanFile,
  getVersionHistory,
} from '../../controllers/guru/laporanResmiController.js'
import { authMiddleware } from '../../middlewares/authMiddleware.js'

const router = Router()

router.use(authMiddleware)

router.get('/', getLaporanList)

router.get('/kelas', getKelasOptions)

router.get('/download/:id', downloadLaporanFile)

router.get('/riwayat/:siswa_id', getVersionHistory)

export default router
