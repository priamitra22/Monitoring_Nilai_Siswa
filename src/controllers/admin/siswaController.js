import {
  fetchDataSiswa,
  fetchDetailSiswa,
  fetchSiswaStatistics,
  checkSingleSiswaService,
  checkSingleSiswaWithExcludeService,
  checkMultipleSiswaService,
  bulkCreateSiswaService,
  updateSiswaService,
  deleteSiswaService,
} from "../../services/admin/siswaService.js";

export const getDataSiswa = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      jenis_kelamin = "",
      sort_by = "created_at",
      sort_order = "desc"
    } = req.query;

    const result = await fetchDataSiswa(page, limit, search, jenis_kelamin, sort_by, sort_order);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getDataSiswa controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getDetailSiswa = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: "error",
        message: "ID siswa tidak valid",
        data: null
      });
    }

    const result = await fetchDetailSiswa(parseInt(id));

    if (result.status === "error") {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getDetailSiswa controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const checkExistingSiswa = async (req, res) => {
  try {
    const { nisn, nik } = req.body;

    if (!nisn && !nik) {
      return res.status(400).json({
        status: "error",
        message: "NISN atau NIK harus diisi",
        data: null
      });
    }

    const result = await checkSingleSiswaService(nisn, nik);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error("Error in checkExistingSiswa controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const checkExistingSiswaWithExclude = async (req, res) => {
  try {
    const { nisn, nik, exclude_id } = req.body;
    if (!nisn && !nik) {
      return res.status(400).json({
        status: "error",
        message: "NISN atau NIK harus diisi",
        data: null
      });
    }

    if (!exclude_id || isNaN(exclude_id)) {
      return res.status(400).json({
        status: "error",
        message: "ID siswa tidak valid",
        data: null
      });
    }

    const result = await checkSingleSiswaWithExcludeService(nisn, nik, exclude_id);

    if (result.status === "error") {
      if (result.message.includes('tidak ditemukan')) {
        return res.status(404).json(result);
      }
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error("Error in checkExistingSiswaWithExclude controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const checkMultipleSiswa = async (req, res) => {
  try {
    const { nisn_list, nik_list } = req.body;
    if (!nisn_list || !nik_list || !Array.isArray(nisn_list) || !Array.isArray(nik_list)) {
      return res.status(400).json({
        status: "error",
        message: "NISN dan NIK harus berupa array",
        data: null
      });
    }

    const result = await checkMultipleSiswaService(nisn_list, nik_list);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error("Error in checkMultipleSiswa controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const bulkCreateSiswa = async (req, res) => {
  try {
    const { siswa } = req.body;
    if (!siswa || !Array.isArray(siswa)) {
      return res.status(400).json({
        status: "error",
        message: "Data siswa harus berupa array",
        data: null
      });
    }

    if (siswa.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Data siswa tidak boleh kosong",
        data: null
      });
    }

    if (siswa.length > 50) {
      return res.status(400).json({
        status: "error",
        message: "Maksimal 50 siswa per request",
        data: null
      });
    }

    const result = await bulkCreateSiswaService(siswa);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error("Error in bulkCreateSiswa controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const updateSiswa = async (req, res) => {
  try {
    const { id } = req.params;
    const siswaData = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: "error",
        message: "ID siswa tidak valid",
        data: null
      });
    }

    const requiredFields = ['nama_lengkap', 'nisn', 'nik', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir'];
    const missingFields = requiredFields.filter(field => !siswaData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Field wajib: ${missingFields.join(', ')}`,
        data: null
      });
    }

    const result = await updateSiswaService(parseInt(id), siswaData);

    if (result.status === "error") {
      if (result.message.includes('tidak ditemukan')) {
        return res.status(404).json(result);
      }
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error("Error in updateSiswa controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const deleteSiswa = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: "error",
        message: "ID siswa tidak valid",
        data: null
      });
    }

    const result = await deleteSiswaService(parseInt(id));

    if (result.status === "error") {
      if (result.message.includes('tidak ditemukan')) {
        return res.status(404).json(result);
      }
      if (result.message.includes('masih terhubung')) {
        return res.status(400).json(result);
      }
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error("Error in deleteSiswa controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};