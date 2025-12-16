import { Router } from 'express'
import { authMiddleware } from '../../middlewares/authMiddleware.js'
import {
  getDaftarSiswa,
  getTranskripNilai,
  downloadTranskripPDF,
  getTahunAjaranDropdown,
  getKelasDropdown,
  getSiswaDropdown,
  downloadBulkTranskrip,
} from '../../controllers/admin/laporanController.js'

const router = Router()

router.use(authMiddleware)

router.get('/tahun-ajaran', getTahunAjaranDropdown)

router.get('/kelas', getKelasDropdown)

router.get('/siswa-dropdown', getSiswaDropdown)

router.get('/siswa', getDaftarSiswa)

router.get('/transkrip/:siswa_id', getTranskripNilai)

router.get('/transkrip/:siswa_id/pdf', downloadTranskripPDF)

router.post('/transkrip/bulk', downloadBulkTranskrip)

export default router
