import express from "express";
import { getTahunajaranKelasGuru, getDaftarKelas, getDropdownKelas, getDropdownWaliKelas, getCurrentSelection, tambahKelas, getDetailKelas, updateKelas, deleteKelas, getInfoKelas, getDaftarSiswaKelas, tambahSiswaKeKelas, searchSiswa, getAvailableSiswa, bulkTambahSiswaKeKelas, hapusSiswaDariKelas, getNaikKelasInfo, executeNaikKelas, getDaftarMataPelajaranKelas, getDropdownMataPelajaran, getDropdownGuru, getDropdownGuruEdit, tambahMataPelajaranKeKelas, tambahMataPelajaranBaru, getDetailMataPelajaranKelas, getDropdownMataPelajaranEdit, updateMataPelajaranKelas, hapusMataPelajaranKelas } from "../../controllers/admin/kelasController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/dropdown/tahun-ajaran", authMiddleware, getTahunajaranKelasGuru);

router.get("/daftar", authMiddleware, getDaftarKelas);

router.get("/dropdown", authMiddleware, getDropdownKelas);

router.get("/dropdown/wali-kelas", authMiddleware, getDropdownWaliKelas);

router.get("/dropdown/current-selection", authMiddleware, getCurrentSelection);

router.post("/tambah", authMiddleware, tambahKelas);

router.get("/:id/detail", authMiddleware, getDetailKelas);

router.get("/:id/info", authMiddleware, getInfoKelas);

router.get("/:id/naik-kelas/info", authMiddleware, getNaikKelasInfo);

router.post("/:id/naik-kelas/execute", authMiddleware, executeNaikKelas);

router.get("/:id/siswa", authMiddleware, getDaftarSiswaKelas);

router.post("/:id/siswa/tambah", authMiddleware, tambahSiswaKeKelas);

router.post("/:id/siswa/tambah-bulk", authMiddleware, bulkTambahSiswaKeKelas);

router.delete("/:id/siswa/:siswa_id/hapus", authMiddleware, hapusSiswaDariKelas);

router.get("/:id/mata-pelajaran", authMiddleware, getDaftarMataPelajaranKelas);

router.get("/mata-pelajaran/dropdown", authMiddleware, getDropdownMataPelajaran);

router.get("/guru/dropdown", authMiddleware, getDropdownGuru);

router.get("/guru/dropdown-edit", authMiddleware, getDropdownGuruEdit);

router.post("/:id/mata-pelajaran/tambah", authMiddleware, tambahMataPelajaranKeKelas);

router.post("/mata-pelajaran/tambah", authMiddleware, tambahMataPelajaranBaru);

router.get("/siswa/search", authMiddleware, searchSiswa);

router.get("/siswa/available", authMiddleware, getAvailableSiswa);

router.put("/:id/update", authMiddleware, updateKelas);

router.delete("/:id/delete", authMiddleware, deleteKelas);

router.get("/:id/mata-pelajaran/:mapel_id/detail", authMiddleware, getDetailMataPelajaranKelas);

router.get("/:id/mata-pelajaran/dropdown-edit", authMiddleware, getDropdownMataPelajaranEdit);

router.put("/:id/mata-pelajaran/:mapel_id/update", authMiddleware, updateMataPelajaranKelas);

router.delete("/:id/mata-pelajaran/:mapel_id/hapus", authMiddleware, hapusMataPelajaranKelas);

export default router;
