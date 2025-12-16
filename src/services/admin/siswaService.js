import {
  getAllDataSiswa,
  getDataSiswaById,
  getSiswaStatistics,
  checkSingleSiswa,
  checkSingleSiswaWithExclude,
  checkMultipleSiswa,
  bulkCreateSiswa,
  updateSiswa,
  deleteSiswa,
} from "../../models/admin/siswaModel.js";

export const fetchDataSiswa = async (
  page = 1,
  limit = 10,
  search = "",
  jenisKelamin = "",
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
      getAllDataSiswa(pageNum, limitNum, search, jenisKelamin, sortBy, sortOrder),
      getSiswaStatistics(search, jenisKelamin)
    ]);

    if (!students.data || students.data.length === 0) {
      return {
        status: "success",
        message: "Data siswa tidak ditemukan",
        data: {
          siswa: [],
          pagination: students.pagination,
          statistics: {
            total_siswa: parseInt(statistics.total_siswa),
            jumlah_laki_laki: parseInt(statistics.jumlah_laki_laki),
            jumlah_perempuan: parseInt(statistics.jumlah_perempuan)
          }
        }
      };
    }

    return {
      status: "success",
      message: "Data siswa berhasil diambil",
      data: {
        siswa: students.data,
        pagination: students.pagination,
        statistics: {
          total_siswa: parseInt(statistics.total_siswa),
          jumlah_laki_laki: parseInt(statistics.jumlah_laki_laki),
          jumlah_perempuan: parseInt(statistics.jumlah_perempuan)
        }
      }
    };
  } catch (error) {
    console.error("Error in fetchDataSiswa service:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil data siswa",
      data: null
    };
  }
};

export const fetchDetailSiswa = async (id) => {
  try {
    if (!id || isNaN(id)) {
      return {
        status: "error",
        message: "ID siswa tidak valid",
        data: null
      };
    }

    const student = await getDataSiswaById(parseInt(id));

    return {
      status: "success",
      message: "Detail siswa berhasil diambil",
      data: student
    };
  } catch (error) {
    console.error("Error in fetchDetailSiswa service:", error);

    if (error.message.includes('tidak ditemukan')) {
      return {
        status: "error",
        message: "Siswa tidak ditemukan",
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil detail siswa",
      data: null
    };
  }
};

export const fetchSiswaStatistics = async (search = "", jenisKelamin = "") => {
  try {
    const statistics = await getSiswaStatistics(search, jenisKelamin);

    return {
      status: "success",
      message: "Statistik siswa berhasil diambil",
      data: {
        total_siswa: parseInt(statistics.total_siswa),
        jumlah_laki_laki: parseInt(statistics.jumlah_laki_laki),
        jumlah_perempuan: parseInt(statistics.jumlah_perempuan)
      }
    };
  } catch (error) {
    console.error("Error in fetchSiswaStatistics service:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil statistik siswa",
      data: null
    };
  }
};

export const checkSingleSiswaService = async (nisn = null, nik = null) => {
  try {
    if (!nisn && !nik) {
      return {
        status: "error",
        message: "NISN atau NIK harus diisi",
        data: null
      };
    }

    const result = await checkSingleSiswa(nisn, nik);

    return {
      status: "success",
      message: "Pengecekan data berhasil",
      data: result
    };

  } catch (error) {
    console.error("Error in checkSingleSiswaService:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengecek data",
      data: null
    };
  }
};

export const checkSingleSiswaWithExcludeService = async (nisn = null, nik = null, excludeId) => {
  try {
    if (!nisn && !nik) {
      return {
        status: "error",
        message: "NISN atau NIK harus diisi",
        data: null
      };
    }

    if (!excludeId || isNaN(excludeId)) {
      return {
        status: "error",
        message: "ID siswa tidak valid",
        data: null
      };
    }

    const result = await checkSingleSiswaWithExclude(nisn, nik, parseInt(excludeId));

    return {
      status: "success",
      message: "Pengecekan data berhasil",
      data: result
    };

  } catch (error) {
    console.error("Error in checkSingleSiswaWithExcludeService:", error);

    if (error.message.includes('tidak ditemukan')) {
      return {
        status: "error",
        message: "Siswa tidak ditemukan",
        data: null
      };
    }

    if (error.message.includes('tidak valid')) {
      return {
        status: "error",
        message: "ID siswa tidak valid",
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat mengecek data",
      data: null
    };
  }
};

export const checkMultipleSiswaService = async (nisnList, nikList) => {
  try {
    if (!nisnList || !nikList || !Array.isArray(nisnList) || !Array.isArray(nikList)) {
      return {
        status: "error",
        message: "NISN dan NIK harus berupa array",
        data: null
      };
    }

    if (nisnList.length === 0 && nikList.length === 0) {
      return {
        status: "success",
        message: "Tidak ada data untuk dicek",
        data: {
          existing_nisn: [],
          existing_nik: []
        }
      };
    }

    const result = await checkMultipleSiswa(nisnList, nikList);

    return {
      status: "success",
      message: "Pengecekan data berhasil",
      data: result
    };

  } catch (error) {
    console.error("Error in checkMultipleSiswaService:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengecek data",
      data: null
    };
  }
};

export const bulkCreateSiswaService = async (siswaData) => {
  try {
    if (!siswaData || !Array.isArray(siswaData)) {
      return {
        status: "error",
        message: "Data siswa harus berupa array",
        data: null
      };
    }

    if (siswaData.length === 0) {
      return {
        status: "error",
        message: "Data siswa tidak boleh kosong",
        data: null
      };
    }

    if (siswaData.length > 50) {
      return {
        status: "error",
        message: "Maksimal 50 siswa per request",
        data: null
      };
    }

    const result = await bulkCreateSiswa(siswaData);

    if (!result.success) {
      if (result.error_type === 'validation') {
        return {
          status: "error",
          message: "Validasi data gagal",
          data: {
            error_type: result.error_type,
            errors: result.validation_errors,
            valid_data: result.valid_data
          }
        };
      }

      if (result.error_type === 'duplicate') {
        return {
          status: "error",
          message: "Data duplikat ditemukan dalam batch",
          data: {
            error_type: result.error_type,
            errors: result.duplicate_errors,
            valid_data: result.valid_data
          }
        };
      }

      if (result.error_type === 'existing') {
        return {
          status: "error",
          message: "Data sudah ada di database",
          data: {
            error_type: result.error_type,
            errors: result.existing_errors,
            valid_data: result.valid_data
          }
        };
      }
    }

    return {
      status: "success",
      message: `Berhasil menambah ${result.inserted_count} siswa`,
      data: {
        inserted_count: result.inserted_count,
        inserted_data: result.inserted_data
      }
    };

  } catch (error) {
    console.error("Error in bulkCreateSiswaService:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat menambah data siswa",
      data: null
    };
  }
};

export const updateSiswaService = async (siswaId, siswaData) => {
  try {
    if (!siswaId || isNaN(siswaId)) {
      return {
        status: "error",
        message: "ID siswa tidak valid",
        data: null
      };
    }

    if (!siswaData || typeof siswaData !== 'object') {
      return {
        status: "error",
        message: "Data siswa tidak valid",
        data: null
      };
    }

    const result = await updateSiswa(parseInt(siswaId), siswaData);

    return {
      status: "success",
      message: result.message,
      data: result.data
    };

  } catch (error) {
    console.error("Error in updateSiswaService:", error);

    try {
      const errorData = JSON.parse(error.message);
      if (errorData.validation_errors) {
        return {
          status: "error",
          message: "Validasi data gagal",
          data: {
            errors: errorData.validation_errors
          }
        };
      }
    } catch (e) {
    }

    if (error.message.includes('NISN sudah digunakan')) {
      return {
        status: "error",
        message: "NISN sudah digunakan oleh siswa lain",
        data: null
      };
    }

    if (error.message.includes('NIK sudah digunakan')) {
      return {
        status: "error",
        message: "NIK sudah digunakan oleh siswa lain",
        data: null
      };
    }

    if (error.message.includes('tidak ditemukan')) {
      return {
        status: "error",
        message: "Siswa tidak ditemukan",
        data: null
      };
    }

    if (error.message.includes('tidak valid')) {
      return {
        status: "error",
        message: "ID siswa tidak valid",
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat memperbarui data siswa",
      data: null
    };
  }
};

export const deleteSiswaService = async (siswaId) => {
  try {
    if (!siswaId || isNaN(siswaId)) {
      return {
        status: "error",
        message: "ID siswa tidak valid",
        data: null
      };
    }

    const result = await deleteSiswa(parseInt(siswaId));

    return {
      status: "success",
      message: result.message,
      data: result.data
    };

  } catch (error) {
    console.error("Error in deleteSiswaService:", error);

    if (error.message.includes('tidak ditemukan')) {
      return {
        status: "error",
        message: "Siswa tidak ditemukan",
        data: null
      };
    }

    if (error.message.includes('tidak valid')) {
      return {
        status: "error",
        message: "ID siswa tidak valid",
        data: null
      };
    }

    if (error.message.includes('masih terhubung')) {
      return {
        status: "error",
        message: "Tidak dapat menghapus siswa karena masih terhubung dengan data lain (kelas/nilai)",
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat menghapus data siswa",
      data: null
    };
  }
};