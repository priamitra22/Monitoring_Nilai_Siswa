import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import {
  getProfileAnak,
  getAbsensiHariIni,
  getCatatanTerbaru,
  getNilaiPerMapel
} from '../../controllers/ortu/dashboardController.js';

const router = Router();

router.use(authMiddleware);

router.get('/profile-anak', getProfileAnak);

router.get('/absensi-hari-ini', getAbsensiHariIni);

router.get('/catatan-terbaru', getCatatanTerbaru);

router.get('/nilai-per-mapel', getNilaiPerMapel);

export default router;

