import {
  fetchDataGuru,
  fetchDetailGuru,
  checkSingleGuruService,
  checkMultipleGuruService,
  bulkCreateGuruService,
  checkSingleGuruWithExcludeService,
  updateGuruService,
  deleteGuruService
} from "../../services/admin/guruService.js";

export const getDataGuru = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      sort_by = "created_at",
      sort_order = "desc"
    } = req.query;

    const result = await fetchDataGuru(page, limit, search, status, sort_by, sort_order);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getDataGuru controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getDetailGuru = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: "error",
        message: "ID guru tidak valid",
        data: null
      });
    }

    const result = await fetchDetailGuru(parseInt(id));

    if (result.status === "error") {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getDetailGuru controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const checkExistingGuru = async (req, res) => {
  try {
    const { nip } = req.body;

    const result = await checkSingleGuruService(nip);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in checkExistingGuru controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const checkMultipleGuru = async (req, res) => {
  try {
    const { nip_list } = req.body;

    const result = await checkMultipleGuruService(nip_list);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in checkMultipleGuru controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const bulkCreateGuru = async (req, res) => {
  try {
    const { guru } = req.body;

    if (!guru || !Array.isArray(guru)) {
      return res.status(400).json({
        status: "error",
        message: "Data guru harus berupa array",
        data: null
      });
    }

    const result = await bulkCreateGuruService(guru);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error in bulkCreateGuru controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const checkExistingGuruWithExclude = async (req, res) => {
  try {
    const { nip, exclude_id } = req.body;

    const result = await checkSingleGuruWithExcludeService(nip, exclude_id);

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in checkExistingGuruWithExclude controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const updateGuru = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_lengkap, nip } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: "error",
        message: "ID guru tidak valid",
        data: null
      });
    }

    const result = await updateGuruService(parseInt(id), { nama_lengkap, nip });

    if (result.status === "error") {
      if (result.message.includes('tidak ditemukan')) {
        return res.status(404).json(result);
      }
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in updateGuru controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const deleteGuru = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: "error",
        message: "ID guru tidak valid",
        data: null
      });
    }

    const result = await deleteGuruService(parseInt(id));

    if (result.status === "error") {
      if (result.message.includes('tidak ditemukan')) {
        return res.status(404).json(result);
      }
      if (result.message.includes('terhubung dengan mata pelajaran')) {
        return res.status(400).json(result);
      }
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in deleteGuru controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};
