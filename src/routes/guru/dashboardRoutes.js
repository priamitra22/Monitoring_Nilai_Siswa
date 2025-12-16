import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import {
  getStatistikSiswa,
  getPeringkatSiswa,
  getMataPelajaran,
  getNilaiPerMapel,
  getKehadiranKelas,
  getKehadiranHariIni,
  getCatatanTerbaru
} from '../../controllers/guru/dashboardController.js';

const router = Router();

router.use(authMiddleware);

router.get('/statistik-siswa', getStatistikSiswa);

router.get('/peringkat-siswa', getPeringkatSiswa);

router.get('/mata-pelajaran', getMataPelajaran);

router.get('/nilai-per-mapel', getNilaiPerMapel);

router.get('/kehadiran-kelas', getKehadiranKelas);

router.get('/kehadiran-hari-ini', getKehadiranHariIni);

router.get('/catatan-terbaru', getCatatanTerbaru);

export default router;

