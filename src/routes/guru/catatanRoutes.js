import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import {
  getCatatanList,
  getCatatanStatistik,
  getKelasDropdown,
  getSiswaDropdown,
  getMapelDropdown,
  createCatatan,
  getCatatanDetail,
  addCatatanReply,
  getCatatanForEdit,
  updateCatatan,
  deleteCatatan
} from '../../controllers/guru/catatanController.js';

const router = Router();

router.use(authMiddleware);

router.get('/statistik', getCatatanStatistik);

router.get('/kelas', getKelasDropdown);

router.get('/siswa', getSiswaDropdown);

router.get('/mata-pelajaran', getMapelDropdown);

router.post('/', createCatatan);

router.post('/:id/reply', addCatatanReply);

router.get('/:id/edit', getCatatanForEdit);

router.put('/:id', updateCatatan);

router.delete('/:id', deleteCatatan);

router.get('/:id', getCatatanDetail);

router.get('/', getCatatanList);

export default router;

