import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import {
  getSummary,
  getSiswaGender,
  getSiswaPerKelas
} from '../../controllers/admin/dashboardController.js';

const router = Router();

router.use(authMiddleware);

router.get('/summary', getSummary);

router.get('/siswa-gender', getSiswaGender);

router.get('/siswa-per-kelas', getSiswaPerKelas);

export default router;

