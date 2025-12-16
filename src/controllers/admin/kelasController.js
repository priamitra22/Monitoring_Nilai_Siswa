import { getTahunajaranKelasGuruService, getDaftarKelasService, getDropdownKelasService, getDropdownWaliKelasService, getCurrentSelectionService, tambahKelasService, getDetailKelasService, updateKelasService, deleteKelasService, getInfoKelasService, getDaftarSiswaKelasService, tambahSiswaKeKelasService, searchSiswaService, getAvailableSiswaService, bulkTambahSiswaKeKelasService, hapusSiswaDariKelasService, getNaikKelasInfoService, executeNaikKelasService, getDaftarMataPelajaranKelasService, getDropdownMataPelajaranService, getDropdownGuruService, getDropdownGuruEditService, tambahMataPelajaranKeKelasService, tambahMataPelajaranBaruService, getDetailMataPelajaranKelasService, getDropdownMataPelajaranEditService, updateMataPelajaranKelasService, hapusMataPelajaranKelasService } from "../../services/admin/kelasService.js";

export const getTahunajaranKelasGuru = async (req, res) => {
  try {
    const result = await getTahunajaranKelasGuruService();

    if (result.status === "error") {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getTahunajaranKelasGuru controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getDaftarKelas = async (req, res) => {
  try {
    const { tahun_ajaran_id, page, limit } = req.query;

    const tahunAjaranId = parseInt(tahun_ajaran_id);
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 5;

    const result = await getDaftarKelasService(tahunAjaranId, pageNumber, limitNumber);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getDaftarKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getDropdownKelas = async (req, res) => {
  try {
    const { tahun_ajaran_id, exclude_kelas_id } = req.query;

    const tahunAjaranId = tahun_ajaran_id ? parseInt(tahun_ajaran_id) : null;

    const excludeKelasId = exclude_kelas_id ? parseInt(exclude_kelas_id) : null;

    const result = await getDropdownKelasService(tahunAjaranId, excludeKelasId);

    if (result.status === "error") {
      return res.status(500).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getDropdownKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getDropdownWaliKelas = async (req, res) => {
  try {
    const { tahun_ajaran_id, exclude_kelas_id } = req.query;

    const tahunAjaranId = tahun_ajaran_id ? parseInt(tahun_ajaran_id) : null;

    const excludeKelasId = exclude_kelas_id ? parseInt(exclude_kelas_id) : null;

    const result = await getDropdownWaliKelasService(tahunAjaranId, excludeKelasId);

    if (result.status === "error") {
      return res.status(500).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getDropdownWaliKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getCurrentSelection = async (req, res) => {
  try {
    const { tahun_ajaran_id } = req.query;

    const tahunAjaranId = tahun_ajaran_id ? parseInt(tahun_ajaran_id) : null;

    const result = await getCurrentSelectionService(tahunAjaranId);

    if (result.status === "error") {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getCurrentSelection controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const tambahKelas = async (req, res) => {
  try {
    const { nama_kelas, wali_kelas_id, tahun_ajaran_id } = req.body;

    const result = await tambahKelasService(nama_kelas, wali_kelas_id, tahun_ajaran_id);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error in tambahKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getDetailKelas = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getDetailKelasService(id);

    if (result.status === "error") {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getDetailKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const updateKelas = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kelas, wali_kelas_id, tahun_ajaran_id } = req.body;

    const result = await updateKelasService(id, nama_kelas, wali_kelas_id, tahun_ajaran_id);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in updateKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const deleteKelas = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteKelasService(id);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in deleteKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getInfoKelas = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getInfoKelasService(id);

    if (result.status === "error") {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getInfoKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getDaftarSiswaKelas = async (req, res) => {
  try {
    const { id } = req.params;
    const { tahun_ajaran_id, page, limit } = req.query;

    const result = await getDaftarSiswaKelasService(id, tahun_ajaran_id, page, limit);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getDaftarSiswaKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const tambahSiswaKeKelas = async (req, res) => {
  try {
    const { id } = req.params;
    const { siswa_id, tahun_ajaran_id } = req.body;

    const result = await tambahSiswaKeKelasService(id, siswa_id, tahun_ajaran_id);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error in tambahSiswaKeKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const searchSiswa = async (req, res) => {
  try {
    const { q, tahun_ajaran_id, limit } = req.query;

    const result = await searchSiswaService(q, tahun_ajaran_id, limit);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in searchSiswa controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getAvailableSiswa = async (req, res) => {
  try {
    const { tahun_ajaran_id, page, limit } = req.query;

    const result = await getAvailableSiswaService(tahun_ajaran_id, page, limit);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getAvailableSiswa controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const bulkTambahSiswaKeKelas = async (req, res) => {
  try {
    const { id } = req.params;
    const { siswa_ids, tahun_ajaran_id } = req.body;

    const result = await bulkTambahSiswaKeKelasService(id, siswa_ids, tahun_ajaran_id);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error in bulkTambahSiswaKeKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const hapusSiswaDariKelas = async (req, res) => {
  try {
    const { id, siswa_id } = req.params;
    const { tahun_ajaran_id } = req.query;

    const result = await hapusSiswaDariKelasService(id, siswa_id, tahun_ajaran_id);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in hapusSiswaDariKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getNaikKelasInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getNaikKelasInfoService(id);

    if (result.status === "error") {
      return res.status(result.data === null ? 400 : 404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getNaikKelasInfo controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const executeNaikKelas = async (req, res) => {
  try {
    const { id } = req.params;
    const { kelas_tujuan_id, tahun_ajaran_tujuan_id, siswa_ids } = req.body;

    const result = await executeNaikKelasService(id, kelas_tujuan_id, tahun_ajaran_tujuan_id, siswa_ids);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in executeNaikKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getDaftarMataPelajaranKelas = async (req, res) => {
  try {
    const { id } = req.params;
    const { tahun_ajaran_id, page, limit } = req.query;

    const result = await getDaftarMataPelajaranKelasService(id, tahun_ajaran_id, page, limit);

    if (result.status === "error") {
      return res.status(result.message === "Kelas tidak ditemukan" ? 404 : 400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getDaftarMataPelajaranKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getDropdownMataPelajaran = async (req, res) => {
  try {
    const { kelas_id, tahun_ajaran_id } = req.query;

    const result = await getDropdownMataPelajaranService(kelas_id, tahun_ajaran_id);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getDropdownMataPelajaran controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getDropdownGuru = async (req, res) => {
  try {
    const result = await getDropdownGuruService();

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getDropdownGuru controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getDropdownGuruEdit = async (req, res) => {
  try {
    const { exclude_guru_id } = req.query;

    const result = await getDropdownGuruEditService(exclude_guru_id);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getDropdownGuruEdit controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const tambahMataPelajaranKeKelas = async (req, res) => {
  try {
    const { id } = req.params;
    const { mapel_id, guru_id, tahun_ajaran_id } = req.body;

    const result = await tambahMataPelajaranKeKelasService(id, mapel_id, guru_id, tahun_ajaran_id);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in tambahMataPelajaranKeKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const tambahMataPelajaranBaru = async (req, res) => {
  try {
    const { nama_mapel } = req.body;

    const result = await tambahMataPelajaranBaruService(nama_mapel);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in tambahMataPelajaranBaru controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getDetailMataPelajaranKelas = async (req, res) => {
  try {
    const { id: kelasId, mapel_id: mapelId } = req.params;

    const result = await getDetailMataPelajaranKelasService(kelasId, mapelId);

    if (result.status === "error") {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getDetailMataPelajaranKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getDropdownMataPelajaranEdit = async (req, res) => {
  try {
    const { id: kelasId } = req.params;
    const { tahun_ajaran_id: tahunAjaranId, exclude_mapel_id: excludeMapelId } = req.query;

    const result = await getDropdownMataPelajaranEditService(kelasId, tahunAjaranId, excludeMapelId);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getDropdownMataPelajaranEdit controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const updateMataPelajaranKelas = async (req, res) => {
  try {
    const { id: kelasId, mapel_id: mapelId } = req.params;
    const { mapel_id: newMapelId, guru_id: guruId, tahun_ajaran_id: tahunAjaranId } = req.body;

    const result = await updateMataPelajaranKelasService(kelasId, mapelId, newMapelId, guruId, tahunAjaranId);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in updateMataPelajaranKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const hapusMataPelajaranKelas = async (req, res) => {
  try {
    const { id: kelasId, mapel_id: mapelId } = req.params;

    const result = await hapusMataPelajaranKelasService(kelasId, mapelId);

    if (result.status === "error") {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in hapusMataPelajaranKelas controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};
