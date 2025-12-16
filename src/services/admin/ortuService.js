import {
  getAllDataOrtu,
  getOrtuById,
  getOrtuByIdWithAnak,
  getOrtuStatistics,
  getAvailableStudents,
  getAvailableStudentsForEdit,
  checkSingleOrtuNik,
  checkSingleOrtuNikWithExclude,
  checkMultipleOrtuNik,
  bulkCreateOrtu,
  updateOrtuWithAnak,
  deleteOrtuWithAnak
} from "../../models/admin/ortuModel.js";

export const fetchDataOrtu = async (
  page = 1,
  limit = 10,
  search = "",
  relasi = "",
  sortBy = "nik",
  sortOrder = "asc"
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

    const [ortuData, statistics] = await Promise.all([
      getAllDataOrtu(pageNum, limitNum, search, relasi, sortBy, sortOrder),
      getOrtuStatistics(search, relasi)
    ]);

    if (!ortuData.data || ortuData.data.length === 0) {
      return {
        status: "success",
        message: "Data orangtua tidak ditemukan",
        data: {
          ortu: [],
          pagination: ortuData.pagination,
          statistics: {
            total_ortu: parseInt(statistics.total_ortu),
            jumlah_ayah: parseInt(statistics.jumlah_ayah),
            jumlah_ibu: parseInt(statistics.jumlah_ibu),
            jumlah_wali: parseInt(statistics.jumlah_wali)
          }
        }
      };
    }

    return {
      status: "success",
      message: "Data orangtua berhasil diambil",
      data: {
        ortu: ortuData.data,
        pagination: ortuData.pagination,
        statistics: {
          total_ortu: parseInt(statistics.total_ortu),
          jumlah_ayah: parseInt(statistics.jumlah_ayah),
          jumlah_ibu: parseInt(statistics.jumlah_ibu),
          jumlah_wali: parseInt(statistics.jumlah_wali)
        }
      }
    };
  } catch (error) {
    console.error("Error in fetchDataOrtu service:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil data orangtua",
      data: null
    };
  }
};

export const fetchDetailOrtu = async (id) => {
  try {
    if (!id || isNaN(id)) {
      return {
        status: "error",
        message: "ID orangtua tidak valid",
        data: null
      };
    }

    const ortu = await getOrtuById(parseInt(id));

    return {
      status: "success",
      message: "Detail orangtua berhasil diambil",
      data: ortu
    };
  } catch (error) {
    console.error("Error in fetchDetailOrtu service:", error);

    if (error.message.includes('tidak ditemukan')) {
      return {
        status: "error",
        message: "Orangtua tidak ditemukan",
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil detail orangtua",
      data: null
    };
  }
};

export const fetchDetailOrtuWithAnak = async (id) => {
  try {
    if (!id || isNaN(id)) {
      return {
        status: "error",
        message: "ID orangtua tidak valid",
        data: null
      };
    }

    const ortu = await getOrtuByIdWithAnak(parseInt(id));

    return {
      status: "success",
      message: "Detail orangtua berhasil diambil",
      data: ortu
    };
  } catch (error) {
    console.error("Error in fetchDetailOrtuWithAnak service:", error);

    if (error.message.includes('tidak ditemukan')) {
      return {
        status: "error",
        message: "Orangtua tidak ditemukan",
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil detail orangtua",
      data: null
    };
  }
};

export const fetchOrtuStatistics = async (search = "", relasi = "") => {
  try {
    const statistics = await getOrtuStatistics(search, relasi);

    return {
      status: "success",
      message: "Statistik orangtua berhasil diambil",
      data: {
        total_ortu: parseInt(statistics.total_ortu),
        jumlah_ayah: parseInt(statistics.jumlah_ayah),
        jumlah_ibu: parseInt(statistics.jumlah_ibu),
        jumlah_wali: parseInt(statistics.jumlah_wali)
      }
    };
  } catch (error) {
    console.error("Error in fetchOrtuStatistics service:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil statistik orangtua",
      data: null
    };
  }
};

export const fetchAvailableStudents = async (search = "", limit = 50, excludeIds = []) => {
  try {
    const limitNum = parseInt(limit);

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return {
        status: "error",
        message: "Limit harus berupa angka antara 1-100",
        data: null
      };
    }

    let parsedExcludeIds = [];
    if (excludeIds) {
      if (typeof excludeIds === 'string') {
        parsedExcludeIds = excludeIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      } else if (Array.isArray(excludeIds)) {
        parsedExcludeIds = excludeIds.map(id => parseInt(id)).filter(id => !isNaN(id));
      }
    }

    const result = await getAvailableStudents(search, limitNum, parsedExcludeIds);

    return {
      status: "success",
      message: "Data siswa tersedia berhasil diambil",
      data: {
        students: result.students,
        total_available: result.total_available
      }
    };
  } catch (error) {
    console.error("Error in fetchAvailableStudents service:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil data siswa tersedia",
      data: null
    };
  }
};

export const fetchAvailableStudentsForEdit = async (search = "", limit = 50, excludeIds = [], includeIds = []) => {
  try {
    const limitNum = parseInt(limit);

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return {
        status: "error",
        message: "Limit harus berupa angka antara 1-100",
        data: null
      };
    }

    let parsedExcludeIds = [];
    if (excludeIds) {
      if (typeof excludeIds === 'string') {
        parsedExcludeIds = excludeIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      } else if (Array.isArray(excludeIds)) {
        parsedExcludeIds = excludeIds.map(id => parseInt(id)).filter(id => !isNaN(id));
      }
    }

    let parsedIncludeIds = [];
    if (includeIds) {
      if (typeof includeIds === 'string') {
        parsedIncludeIds = includeIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      } else if (Array.isArray(includeIds)) {
        parsedIncludeIds = includeIds.map(id => parseInt(id)).filter(id => !isNaN(id));
      }
    }

    const result = await getAvailableStudentsForEdit(search, limitNum, parsedExcludeIds, parsedIncludeIds);

    return {
      status: "success",
      message: "Data siswa tersedia untuk edit berhasil diambil",
      data: {
        students: result.students,
        total_available: result.total_available
      }
    };
  } catch (error) {
    console.error("Error in fetchAvailableStudentsForEdit service:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil data siswa tersedia untuk edit",
      data: null
    };
  }
};

export const checkSingleOrtuNikService = async (nik = null) => {
  try {
    if (!nik || typeof nik !== 'string') {
      return { status: "error", message: "NIK harus diisi", data: null };
    }
    const nikExists = await checkSingleOrtuNik(nik);
    return { status: "success", message: "Pengecekan NIK berhasil", data: { nik_exists: nikExists } };
  } catch (error) {
    console.error("Error in checkSingleOrtuNikService:", error);
    return { status: "error", message: "Terjadi kesalahan saat mengecek NIK", data: null };
  }
};

export const checkSingleOrtuNikWithExcludeService = async (nik = null, excludeId = null) => {
  try {
    if (!nik || typeof nik !== 'string') {
      return { status: "error", message: "NIK harus diisi", data: null };
    }

    if (!excludeId || typeof excludeId !== 'number') {
      return { status: "error", message: "Exclude ID harus diisi", data: null };
    }

    const nikExists = await checkSingleOrtuNikWithExclude(nik, excludeId);
    return { status: "success", message: "Pengecekan NIK berhasil", data: { nik_exists: nikExists } };
  } catch (error) {
    console.error("Error in checkSingleOrtuNikWithExcludeService:", error);
    return { status: "error", message: "Terjadi kesalahan saat mengecek NIK", data: null };
  }
};

export const checkMultipleOrtuNikService = async (nikList) => {
  try {
    if (!nikList || !Array.isArray(nikList) || nikList.length === 0) {
      return { status: "error", message: "List NIK harus berupa array dan tidak boleh kosong", data: null };
    }
    if (nikList.length > 50) {
      return { status: "error", message: "Maksimal 50 NIK per request", data: null };
    }
    const existingNiks = await checkMultipleOrtuNik(nikList);
    return { status: "success", message: "Pengecekan NIK berhasil", data: { existing_niks: existingNiks } };
  } catch (error) {
    console.error("Error in checkMultipleOrtuNikService:", error);
    return { status: "error", message: "Terjadi kesalahan saat mengecek NIK", data: null };
  }
};

export const bulkCreateOrtuService = async (ortuData) => {
  try {
    if (!ortuData || !Array.isArray(ortuData) || ortuData.length === 0) {
      return { status: "error", message: "Data orangtua harus berupa array dan tidak boleh kosong", data: null };
    }

    if (ortuData.length > 50) {
      return { status: "error", message: "Maksimal 50 orangtua per request", data: null };
    }

    const result = await bulkCreateOrtu(ortuData);
    return {
      status: "success",
      message: `Berhasil menambah ${result.inserted_count} orangtua`,
      data: result
    };
  } catch (error) {
    console.error("Error in bulkCreateOrtuService:", error);

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
    } else if (error.type === 'duplicate') {
      return {
        status: "error",
        message: "Data duplikat ditemukan dalam batch",
        data: {
          error_type: "duplicate",
          errors: error.errors,
          valid_data: error.valid_data
        }
      };
    } else if (error.type === 'existing') {
      return {
        status: "error",
        message: "Data sudah ada di database",
        data: {
          error_type: "existing",
          errors: error.errors,
          valid_data: error.valid_data
        }
      };
    } else {
      return { status: "error", message: "Terjadi kesalahan saat menambah orangtua", data: null };
    }
  }
};

export const updateOrtuWithAnakService = async (ortuId, ortuData, anakData) => {
  try {
    if (!ortuId || typeof ortuId !== 'number') {
      return { status: "error", message: "ID orangtua harus diisi dan berupa angka", data: null };
    }
    if (!ortuData || typeof ortuData !== 'object') {
      return { status: "error", message: "Data orangtua harus diisi", data: null };
    }

    const { nama_lengkap, nik, kontak, relasi } = ortuData;


    if (!nama_lengkap || typeof nama_lengkap !== 'string' || nama_lengkap.trim().length < 2) {
      return { status: "error", message: "Nama lengkap harus diisi dan minimal 2 karakter", data: null };
    }

    if (!nik || typeof nik !== 'string' || !/^\d{16}$/.test(nik)) {
      return { status: "error", message: "NIK harus diisi dan berupa 16 digit angka", data: null };
    }

    if (!kontak || typeof kontak !== 'string' || kontak.trim().length < 10) {
      return { status: "error", message: "Kontak harus diisi dan minimal 10 karakter", data: null };
    }

    if (!relasi || typeof relasi !== 'string' || !['Ayah', 'Ibu', 'Wali'].includes(relasi)) {
      return { status: "error", message: "Relasi harus diisi dan berupa Ayah, Ibu, atau Wali", data: null };
    }

    if (anakData && !Array.isArray(anakData)) {
      return { status: "error", message: "Data anak harus berupa array", data: null };
    }

    if (anakData && anakData.length > 0) {
      for (let i = 0; i < anakData.length; i++) {
        const anak = anakData[i];
        if (!anak.id || typeof anak.id !== 'number') {
          return { status: "error", message: `Data anak ke-${i + 1}: ID harus diisi dan berupa angka`, data: null };
        }
        if (!anak.nama_lengkap || typeof anak.nama_lengkap !== 'string') {
          return { status: "error", message: `Data anak ke-${i + 1}: Nama lengkap harus diisi`, data: null };
        }
        if (!anak.nisn || typeof anak.nisn !== 'string') {
          return { status: "error", message: `Data anak ke-${i + 1}: NISN harus diisi`, data: null };
        }
      }
    }

    const result = await updateOrtuWithAnak(ortuId, ortuData, anakData || []);
    return { status: "success", message: "Data orangtua berhasil diperbarui", data: result };
  } catch (error) {
    console.error("Error in updateOrtuWithAnakService:", error);
    return { status: "error", message: error.message, data: null };
  }
};

export const deleteOrtuWithAnakService = async (ortuId) => {
  try {
    if (!ortuId || typeof ortuId !== 'number') {
      return { status: "error", message: "ID orangtua harus diisi dan berupa angka", data: null };
    }

    const result = await deleteOrtuWithAnak(ortuId);
    return { status: "success", message: "Data orangtua berhasil dihapus", data: result };
  } catch (error) {
    console.error("Error in deleteOrtuWithAnakService:", error);
    return { status: "error", message: error.message, data: null };
  }
};
