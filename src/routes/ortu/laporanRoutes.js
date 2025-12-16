import express from 'express'
import * as laporanController from '../../controllers/ortu/laporanController.js'
import { authMiddleware } from '../../middlewares/authMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/tahun-ajaran', laporanController.getTahunAjaran)

router.get('/semester', laporanController.getSemester)

router.get('/nilai', laporanController.getNilaiLaporan)

router.post('/download-pdf', laporanController.downloadPDF)

export default router
