import { Router } from 'express'
import {
  getAllLaporanResmi,
  getLaporanDetail,
  getVersionHistory,
  uploadLaporan,
  updateLaporan,
  deleteLaporan,
  downloadLaporan,
} from '../../controllers/admin/laporanResmiController.js'
import { authMiddleware } from '../../middlewares/authMiddleware.js'
import { uploadLaporanResmi, handleMulterError } from '../../config/multerConfig.js'

const router = Router()

router.use(authMiddleware)

router.get('/', getAllLaporanResmi)

router.get('/download/:id', downloadLaporan)
router.get('/riwayat/:siswa_id', getVersionHistory)

router.get('/:id', getLaporanDetail)

router.post('/upload', uploadLaporanResmi.single('file'), handleMulterError, uploadLaporan)
router.put('/:id', uploadLaporanResmi.single('file'), handleMulterError, updateLaporan)
router.delete('/:id', deleteLaporan)

export default router
