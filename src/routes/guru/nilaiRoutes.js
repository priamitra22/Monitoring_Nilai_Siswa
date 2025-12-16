import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import {
  getKelasDropdown,
  getMapelDropdown,
  getTahunAjaranAktif,
  getSiswaWithNilai,
  simpanCell
} from '../../controllers/guru/nilaiController.js';

const router = Router();

router.use(authMiddleware);

router.get('/kelas', getKelasDropdown);

router.get('/mata-pelajaran', getMapelDropdown);

router.get('/tahun-ajaran-aktif', getTahunAjaranAktif);

router.get('/siswa', getSiswaWithNilai);

router.post('/simpan-cell', simpanCell);

export default router;

