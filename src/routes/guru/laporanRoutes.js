import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import {
  getKelasWali,
  getSiswaList,
  getPerkembanganSiswa,
  downloadPDFPerkembangan
} from '../../controllers/guru/laporanController.js';

const router = Router();

router.use(authMiddleware);

router.get('/kelas-wali', getKelasWali);

router.get('/siswa', getSiswaList);

router.get('/perkembangan', getPerkembanganSiswa);

router.post('/download-perkembangan', downloadPDFPerkembangan);

export default router;

