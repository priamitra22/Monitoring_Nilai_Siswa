import express from 'express'
import { authMiddleware } from '../../middlewares/authMiddleware.js'
import laporanResmiController from '../../controllers/ortu/laporanResmiController.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', laporanResmiController.getAllLaporan)

router.get('/download/:id', laporanResmiController.downloadLaporan)

export default router
