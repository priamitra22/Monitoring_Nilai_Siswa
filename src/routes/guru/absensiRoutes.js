import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import {
  getSiswaAbsensi,
  getKelasSaya,
  saveAbsensi,
  getRekapAbsensi,
  getDateRange
} from '../../controllers/guru/absensiController.js';

const router = Router();

router.use(authMiddleware);

router.get('/date-range', getDateRange);

router.get('/kelas-saya', getKelasSaya);

router.get('/siswa', getSiswaAbsensi);

router.post('/save', saveAbsensi);

router.get('/rekap', getRekapAbsensi);

export default router;

