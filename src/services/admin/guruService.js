import {
  getAllDataGuru,
  getGuruById,
  getGuruStatistics,
  checkSingleGuru,
  checkMultipleGuru,
  bulkCreateGuru,
  checkSingleGuruWithExclude,
  updateGuru,
  deleteGuru
} from "../../models/admin/guruModel.js";

export const fetchDataGuru = async (
  page = 1,
  limit = 10,
  search = "",
  status = "",
  sortBy = "created_at",
  sortOrder = "desc"
) => {
  try {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      return {
        status: "error",
        message: "Halaman harus berupa angka positif",
        data: null
      };
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return {
        status: "error",
        message: "Limit harus berupa angka antara 1-100",
        data: null
      };
    }

    const [students, statistics] = await Promise.all([
      getAllDataGuru(pageNum, limitNum, search, status, sortBy, sortOrder),
      getGuruStatistics(search, status)
    ]);

    if (!students.data || students.data.length === 0) {
      return {
        status: "success",
        message: "Data guru tidak ditemukan",
        data: {
          guru: [],
          pagination: students.pagination,
          statistics: {
            total_guru: parseInt(statistics.total_guru),
            jumlah_aktif: parseInt(statistics.jumlah_aktif),
            jumlah_tidak_aktif: parseInt(statistics.jumlah_tidak_aktif)
          }
        }
      };
    }

    return {
      status: "success",
      message: "Data guru berhasil diambil",
      data: {
        guru: students.data,
        pagination: students.pagination,
        statistics: {
          total_guru: parseInt(statistics.total_guru),
          jumlah_aktif: parseInt(statistics.jumlah_aktif),
          jumlah_tidak_aktif: parseInt(statistics.jumlah_tidak_aktif)
        }
      }
    };
  } catch (error) {
    console.error("Error in fetchDataGuru service:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil data guru",
      data: null
    };
  }
};

export const fetchDetailGuru = async (id) => {
  try {
    if (!id || isNaN(id)) {
      return {
        status: "error",
        message: "ID guru tidak valid",
        data: null
      };
    }

    const guru = await getGuruById(parseInt(id));

    return {
      status: "success",
      message: "Detail guru berhasil diambil",
      data: guru
    };
  } catch (error) {
    console.error("Error in fetchDetailGuru service:", error);

    if (error.message.includes('tidak ditemukan')) {
      return {
        status: "error",
        message: "Guru tidak ditemukan",
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil detail guru",
      data: null
    };
  }
};

export const fetchGuruStatistics = async (search = "", status = "") => {
  try {
    const statistics = await getGuruStatistics(search, status);

    return {
      status: "success",
      message: "Statistik guru berhasil diambil",
      data: {
        total_guru: parseInt(statistics.total_guru),
        jumlah_aktif: parseInt(statistics.jumlah_aktif),
        jumlah_tidak_aktif: parseInt(statistics.jumlah_tidak_aktif)
      }
    };
  } catch (error) {
    console.error("Error in fetchGuruStatistics service:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil statistik guru",
      data: null
    };
  }
};

export const checkSingleGuruService = async (nip = null) => {
  try {
    if (!nip || typeof nip !== 'string') {
      return {
        status: "error",
        message: "NIP harus diisi",
        data: null
      };
    }

    const nipExists = await checkSingleGuru(nip);

    return {
      status: "success",
      message: "Pengecekan NIP berhasil",
      data: {
        nip_exists: nipExists
      }
    };
  } catch (error) {
    console.error("Error in checkSingleGuruService:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengecek NIP",
      data: null
    };
  }
};

export const checkMultipleGuruService = async (nipList) => {
  try {
    if (!nipList || !Array.isArray(nipList)) {
      return {
        status: "error",
        message: "List NIP harus berupa array",
        data: null
      };
    }

    if (nipList.length === 0) {
      return {
        status: "error",
        message: "List NIP tidak boleh kosong",
        data: null
      };
    }

    if (nipList.length > 50) {
      return {
        status: "error",
        message: "Maksimal 50 NIP per request",
        data: null
      };
    }

    const existingNips = await checkMultipleGuru(nipList);

    return {
      status: "success",
      message: "Pengecekan batch NIP berhasil",
      data: {
        existing_nips: existingNips,
        total_checked: nipList.length,
        total_existing: existingNips.length
      }
    };
  } catch (error) {
    console.error("Error in checkMultipleGuruService:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengecek NIP",
      data: null
    };
  }
};

export const bulkCreateGuruService = async (guruData) => {
  try {
    if (!guruData || !Array.isArray(guruData)) {
      return {
        status: "error",
        message: "Data guru harus berupa array",
        data: null
      };
    }

    if (guruData.length === 0) {
      return {
        status: "error",
        message: "Data guru tidak boleh kosong",
        data: null
      };
    }

    const result = await bulkCreateGuru(guruData);

    return {
      status: "success",
      message: `Berhasil menambah ${result.inserted_count} guru`,
      data: result
    };
  } catch (error) {
    console.error("Error in bulkCreateGuruService:", error);

    if (error.type === 'validation') {
      return {
        status: "error",
        message: "Validasi data gagal",
        data: {
          error_type: "validation",
          errors: error.errors,
          valid_data: error.valid_data
        }
      };
    }

    if (error.type === 'duplicate') {
      return {
        status: "error",
        message: "Data duplikat ditemukan dalam batch",
        data: {
          error_type: "duplicate",
          errors: error.errors,
          valid_data: error.valid_data
        }
      };
    }

    if (error.type === 'existing') {
      return {
        status: "error",
        message: "Data sudah ada di database",
        data: {
          error_type: "existing",
          errors: error.errors,
          valid_data: error.valid_data
        }
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat menambah guru",
      data: null
    };
  }
};

export const checkSingleGuruWithExcludeService = async (nip = null, excludeId) => {
  try {
    if (!nip || typeof nip !== 'string') {
      return {
        status: "error",
        message: "NIP harus diisi",
        data: null
      };
    }

    if (!excludeId || isNaN(excludeId)) {
      return {
        status: "error",
        message: "ID guru harus diisi dan berupa angka",
        data: null
      };
    }

    const nipExists = await checkSingleGuruWithExclude(nip, parseInt(excludeId));

    return {
      status: "success",
      message: "Pengecekan NIP berhasil",
      data: {
        nip_exists: nipExists
      }
    };
  } catch (error) {
    console.error("Error in checkSingleGuruWithExcludeService:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengecek NIP",
      data: null
    };
  }
};

export const updateGuruService = async (guruId, guruData) => {
  try {
    if (!guruId || isNaN(guruId)) {
      return {
        status: "error",
        message: "ID guru tidak valid",
        data: null
      };
    }

    const result = await updateGuru(parseInt(guruId), guruData);

    return {
      status: "success",
      message: "Data guru berhasil diperbarui",
      data: result
    };
  } catch (error) {
    console.error("Error in updateGuruService:", error);

    if (error.type === 'validation') {
      return {
        status: "error",
        message: "Validasi data gagal",
        data: {
          errors: error.errors
        }
      };
    }

    if (error.message.includes('tidak ditemukan')) {
      return {
        status: "error",
        message: "Guru tidak ditemukan",
        data: null
      };
    }

    if (error.message.includes('sudah digunakan')) {
      return {
        status: "error",
        message: "NIP sudah digunakan oleh guru lain",
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat memperbarui guru",
      data: null
    };
  }
};

export const deleteGuruService = async (guruId) => {
  try {
    if (!guruId || isNaN(guruId)) {
      return {
        status: "error",
        message: "ID guru tidak valid",
        data: null
      };
    }

    const result = await deleteGuru(parseInt(guruId));

    return {
      status: "success",
      message: "Data guru berhasil dihapus",
      data: result
    };
  } catch (error) {
    console.error("Error in deleteGuruService:", error);

    if (error.message.includes('tidak ditemukan')) {
      return {
        status: "error",
        message: "Guru tidak ditemukan",
        data: null
      };
    }

    if (error.message.includes('terhubung dengan mata pelajaran')) {
      return {
        status: "error",
        message: "Guru tidak dapat dihapus karena masih mengajar di kelas",
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat menghapus guru",
      data: null
    };
  }
};