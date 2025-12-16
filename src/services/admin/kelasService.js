import { getTahunajaranKelasGuru, getDaftarKelas, getDropdownKelas, getDropdownWaliKelas, getCurrentSelection, tambahKelas, getDetailKelas, updateKelas, deleteKelas, getInfoKelas, getDaftarSiswaKelas, tambahSiswaKeKelas, searchSiswa, getAvailableSiswa, bulkTambahSiswaKeKelas, hapusSiswaDariKelas, getNaikKelasInfo, executeNaikKelas, getDaftarMataPelajaranKelas, getDropdownMataPelajaran, getDropdownGuru, getDropdownGuruEdit, tambahMataPelajaranKeKelas, tambahMataPelajaranBaru, getDetailMataPelajaranKelas, getDropdownMataPelajaranEdit, updateMataPelajaranKelas, hapusMataPelajaranKelas } from "../../models/admin/kelasModel.js";

export const getTahunajaranKelasGuruService = async () => {
  try {
    const result = await getTahunajaranKelasGuru();

    if (!result.tahunAjaranList || result.tahunAjaranList.length === 0) {
      return {
        status: "error",
        message: "Data tahun ajaran tidak ditemukan",
        data: null
      };
    }

    return {
      status: "success",
      message: "Data dropdown tahun ajaran berhasil diambil",
      data: {
        tahunAjaranList: result.tahunAjaranList,
        tahunAjaranAktif: result.tahunAjaranAktif
      }
    };
  } catch (error) {
    console.error("Error in getTahunajaranKelasGuruService:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil data tahun ajaran",
      data: null
    };
  }
};

export const getDaftarKelasService = async (tahunAjaranId, page = 1, limit = 5) => {
  try {
    if (!tahunAjaranId) {
      return {
        status: "error",
        message: "tahun_ajaran_id diperlukan",
        data: null
      };
    }

    if (page < 1) {
      return {
        status: "error",
        message: "Halaman harus lebih dari 0",
        data: null
      };
    }

    if (limit < 1 || limit > 100) {
      return {
        status: "error",
        message: "Limit harus antara 1-100",
        data: null
      };
    }

    const result = await getDaftarKelas(tahunAjaranId, page, limit);

    if (!result.kelas || result.kelas.length === 0) {
      return {
        status: "success",
        message: "Data kelas tidak ditemukan",
        data: {
          kelas: [],
          pagination: result.pagination
        }
      };
    }

    return {
      status: "success",
      message: "Data daftar kelas berhasil diambil",
      data: result
    };
  } catch (error) {
    console.error("Error in getDaftarKelasService:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil data kelas",
      data: null
    };
  }
};

export const getDropdownKelasService = async (tahunAjaranId = null, excludeKelasId = null) => {
  try {
    const kelasList = await getDropdownKelas(tahunAjaranId, excludeKelasId);

    if (!kelasList || kelasList.length === 0) {
      let message;
      if (tahunAjaranId && excludeKelasId) {
        message = "Tidak ada kelas yang tersedia untuk tahun ajaran ini";
      } else if (tahunAjaranId) {
        message = "Tidak ada kelas untuk tahun ajaran ini";
      } else {
        message = "Data kelas tidak ditemukan";
      }

      return {
        status: "success",
        message: message,
        data: []
      };
    }

    return {
      status: "success",
      message: "Data dropdown kelas berhasil diambil",
      data: kelasList
    };
  } catch (error) {
    console.error("Error in getDropdownKelasService:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil data kelas",
      data: null
    };
  }
};

export const getDropdownWaliKelasService = async (tahunAjaranId = null, excludeKelasId = null) => {
  try {
    const waliKelasList = await getDropdownWaliKelas(tahunAjaranId, excludeKelasId);

    if (!waliKelasList || waliKelasList.length === 0) {
      let message;
      if (tahunAjaranId && excludeKelasId) {
        message = "Tidak ada guru aktif yang tersedia untuk tahun ajaran ini";
      } else if (tahunAjaranId) {
        message = "Tidak ada guru aktif yang tersedia untuk tahun ajaran ini (semua guru sudah menjadi wali kelas)";
      } else {
        message = "Tidak ada guru aktif yang tersedia";
      }

      return {
        status: "success",
        message: message,
        data: []
      };
    }

    return {
      status: "success",
      message: "Data dropdown wali kelas berhasil diambil",
      data: waliKelasList
    };
  } catch (error) {
    console.error("Error in getDropdownWaliKelasService:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil data wali kelas",
      data: null
    };
  }
};

export const getCurrentSelectionService = async (tahunAjaranId = null) => {
  try {
    const currentSelection = await getCurrentSelection(tahunAjaranId);

    if (!currentSelection) {
      const message = tahunAjaranId
        ? "Tahun ajaran yang dipilih tidak ditemukan"
        : "Tidak ada tahun ajaran aktif";

      return {
        status: "error",
        message: message,
        data: null
      };
    }

    return {
      status: "success",
      message: "Data current selection berhasil diambil",
      data: currentSelection
    };
  } catch (error) {
    console.error("Error in getCurrentSelectionService:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil current selection",
      data: null
    };
  }
};

export const tambahKelasService = async (namaKelas, waliKelasId, tahunAjaranId) => {
  try {
    if (!namaKelas || !waliKelasId || !tahunAjaranId) {
      return {
        status: "error",
        message: "Semua field harus diisi (nama_kelas, wali_kelas_id, tahun_ajaran_id)",
        data: null
      };
    }
    if (namaKelas.trim().length === 0) {
      return {
        status: "error",
        message: "Nama kelas tidak boleh kosong",
        data: null
      };
    }
    if (isNaN(waliKelasId) || isNaN(tahunAjaranId)) {
      return {
        status: "error",
        message: "wali_kelas_id dan tahun_ajaran_id harus berupa angka",
        data: null
      };
    }
    const kelasBaru = await tambahKelas(namaKelas.trim(), parseInt(waliKelasId), parseInt(tahunAjaranId));

    return {
      status: "success",
      message: "Kelas berhasil ditambahkan",
      data: kelasBaru
    };
  } catch (error) {
    console.error("Error in tambahKelasService:", error);
    if (error.message === 'Nama kelas sudah ada untuk tahun ajaran ini') {
      return {
        status: "error",
        message: "Nama kelas sudah ada untuk tahun ajaran ini",
        data: null
      };
    }
    if (error.message.includes('Guru ini sudah menjadi wali kelas untuk kelas')) {
      return {
        status: "error",
        message: error.message,
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat menambahkan kelas",
      data: null
    };
  }
};

export const getDetailKelasService = async (kelasId) => {
  try {
    if (!kelasId || isNaN(kelasId)) {
      return {
        status: "error",
        message: "ID kelas harus berupa angka",
        data: null
      };
    }
    const detailKelas = await getDetailKelas(parseInt(kelasId));

    if (!detailKelas) {
      return {
        status: "error",
        message: "Kelas tidak ditemukan",
        data: null
      };
    }

    return {
      status: "success",
      message: "Data detail kelas berhasil diambil",
      data: detailKelas
    };
  } catch (error) {
    console.error("Error in getDetailKelasService:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil detail kelas",
      data: null
    };
  }
};
export const updateKelasService = async (kelasId, namaKelas, waliKelasId, tahunAjaranId) => {
  try {
    if (!kelasId || isNaN(kelasId)) {
      return {
        status: "error",
        message: "ID kelas harus berupa angka",
        data: null
      };
    }

    if (!namaKelas || !waliKelasId || !tahunAjaranId) {
      return {
        status: "error",
        message: "Semua field harus diisi (nama_kelas, wali_kelas_id, tahun_ajaran_id)",
        data: null
      };
    }
    if (namaKelas.trim().length === 0) {
      return {
        status: "error",
        message: "Nama kelas tidak boleh kosong",
        data: null
      };
    }
    if (isNaN(waliKelasId) || isNaN(tahunAjaranId)) {
      return {
        status: "error",
        message: "wali_kelas_id dan tahun_ajaran_id harus berupa angka",
        data: null
      };
    }
    const kelasUpdated = await updateKelas(parseInt(kelasId), namaKelas.trim(), parseInt(waliKelasId), parseInt(tahunAjaranId));

    return {
      status: "success",
      message: "Kelas berhasil diupdate",
      data: kelasUpdated
    };
  } catch (error) {
    console.error("Error in updateKelasService:", error);
    if (error.message === 'Nama kelas sudah ada untuk tahun ajaran ini') {
      return {
        status: "error",
        message: "Nama kelas sudah ada untuk tahun ajaran ini",
        data: null
      };
    }
    if (error.message.includes('Guru ini sudah menjadi wali kelas untuk kelas')) {
      return {
        status: "error",
        message: error.message,
        data: null
      };
    }
    if (error.message === 'Kelas tidak ditemukan') {
      return {
        status: "error",
        message: "Kelas tidak ditemukan",
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat mengupdate kelas",
      data: null
    };
  }
};

export const deleteKelasService = async (kelasId) => {
  try {
    if (!kelasId || isNaN(kelasId)) {
      return {
        status: "error",
        message: "ID kelas harus berupa angka",
        data: null
      };
    }
    const kelasDeleted = await deleteKelas(parseInt(kelasId));

    return {
      status: "success",
      message: "Kelas berhasil dihapus",
      data: kelasDeleted
    };
  } catch (error) {
    console.error("Error in deleteKelasService:", error);
    if (error.message.includes('Kelas tidak dapat dihapus karena masih memiliki') && error.message.includes('siswa')) {
      return {
        status: "error",
        message: error.message,
        data: null
      };
    }
    if (error.message.includes('Kelas tidak dapat dihapus karena masih memiliki') && error.message.includes('mata pelajaran')) {
      return {
        status: "error",
        message: error.message,
        data: null
      };
    }
    if (error.message === 'Kelas tidak ditemukan') {
      return {
        status: "error",
        message: "Kelas tidak ditemukan",
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat menghapus kelas",
      data: null
    };
  }
};

export const getInfoKelasService = async (kelasId) => {
  try {
    if (!kelasId || isNaN(kelasId)) {
      return {
        status: "error",
        message: "ID kelas harus berupa angka",
        data: null
      };
    }
    const infoKelas = await getInfoKelas(parseInt(kelasId));

    if (!infoKelas) {
      return {
        status: "error",
        message: "Kelas tidak ditemukan",
        data: null
      };
    }

    return {
      status: "success",
      message: "Data info kelas berhasil diambil",
      data: infoKelas
    };
  } catch (error) {
    console.error("Error in getInfoKelasService:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil info kelas",
      data: null
    };
  }
};

export const getDaftarSiswaKelasService = async (kelasId, tahunAjaranId = null, page = 1, limit = 20) => {
  try {
    if (!kelasId || isNaN(kelasId)) {
      return {
        status: "error",
        message: "ID kelas harus berupa angka",
        data: null
      };
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    if (pageNum < 1) {
      return {
        status: "error",
        message: "Halaman harus lebih dari 0",
        data: null
      };
    }

    if (limitNum < 1 || limitNum > 100) {
      return {
        status: "error",
        message: "Limit harus antara 1-100",
        data: null
      };
    }

    let tahunAjaranIdNum = null;
    if (tahunAjaranId) {
      if (isNaN(tahunAjaranId)) {
        return {
          status: "error",
          message: "tahun_ajaran_id harus berupa angka",
          data: null
        };
      }
      tahunAjaranIdNum = parseInt(tahunAjaranId);
    }
    const result = await getDaftarSiswaKelas(parseInt(kelasId), tahunAjaranIdNum, pageNum, limitNum);

    return {
      status: "success",
      message: "Data daftar siswa berhasil diambil",
      data: result
    };
  } catch (error) {
    console.error("Error in getDaftarSiswaKelasService:", error);
    if (error.message === 'Kelas tidak ditemukan') {
      return {
        status: "error",
        message: "Kelas tidak ditemukan",
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil daftar siswa",
      data: null
    };
  }
};

export const tambahSiswaKeKelasService = async (kelasId, siswaId, tahunAjaranId) => {
  try {
    if (!kelasId || isNaN(kelasId)) {
      return {
        status: "error",
        message: "ID kelas harus berupa angka",
        data: null
      };
    }

    if (!siswaId || isNaN(siswaId)) {
      return {
        status: "error",
        message: "ID siswa harus berupa angka",
        data: null
      };
    }

    if (!tahunAjaranId || isNaN(tahunAjaranId)) {
      return {
        status: "error",
        message: "ID tahun ajaran harus berupa angka",
        data: null
      };
    }

    const result = await tambahSiswaKeKelas(parseInt(kelasId), parseInt(siswaId), parseInt(tahunAjaranId));

    return {
      status: "success",
      message: "Siswa berhasil ditambahkan ke kelas",
      data: result
    };
  } catch (error) {
    console.error("Error in tambahSiswaKeKelasService:", error);
    if (error.message === 'Siswa tidak ditemukan') {
      return {
        status: "error",
        message: "Siswa tidak ditemukan",
        data: null
      };
    }

    if (error.message === 'Kelas atau tahun ajaran tidak ditemukan') {
      return {
        status: "error",
        message: "Kelas atau tahun ajaran tidak ditemukan",
        data: null
      };
    }

    if (error.message.includes('Siswa sudah terdaftar di kelas')) {
      return {
        status: "error",
        message: error.message,
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat menambahkan siswa ke kelas",
      data: null
    };
  }
};

export const searchSiswaService = async (query, tahunAjaranId, limit = 20) => {
  try {
    if (!query || query.trim().length === 0) {
      return {
        status: "error",
        message: "Query pencarian tidak boleh kosong",
        data: null
      };
    }

    if (!tahunAjaranId || isNaN(tahunAjaranId)) {
      return {
        status: "error",
        message: "ID tahun ajaran harus berupa angka",
        data: null
      };
    }

    const limitNum = parseInt(limit) || 20;
    if (limitNum < 1 || limitNum > 100) {
      return {
        status: "error",
        message: "Limit harus antara 1-100",
        data: null
      };
    }

    const result = await searchSiswa(query.trim(), parseInt(tahunAjaranId), limitNum);

    return {
      status: "success",
      message: "Data pencarian siswa berhasil diambil",
      data: result
    };
  } catch (error) {
    console.error("Error in searchSiswaService:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mencari siswa",
      data: null
    };
  }
};

export const getAvailableSiswaService = async (tahunAjaranId, page = 1, limit = 50) => {
  try {
    if (!tahunAjaranId || isNaN(tahunAjaranId)) {
      return {
        status: "error",
        message: "ID tahun ajaran harus berupa angka",
        data: null
      };
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;

    if (pageNum < 1) {
      return {
        status: "error",
        message: "Halaman harus lebih dari 0",
        data: null
      };
    }

    if (limitNum < 1 || limitNum > 100) {
      return {
        status: "error",
        message: "Limit harus antara 1-100",
        data: null
      };
    }

    const result = await getAvailableSiswa(parseInt(tahunAjaranId), pageNum, limitNum);

    return {
      status: "success",
      message: "Data siswa tersedia berhasil diambil",
      data: result
    };
  } catch (error) {
    console.error("Error in getAvailableSiswaService:", error);
    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil data siswa tersedia",
      data: null
    };
  }
};

export const bulkTambahSiswaKeKelasService = async (kelasId, siswaIds, tahunAjaranId) => {
  try {
    if (!kelasId || isNaN(kelasId)) {
      return {
        status: "error",
        message: "ID kelas harus berupa angka",
        data: null
      };
    }

    if (!siswaIds || !Array.isArray(siswaIds) || siswaIds.length === 0) {
      return {
        status: "error",
        message: "Daftar ID siswa harus berupa array dan tidak boleh kosong",
        data: null
      };
    }

    if (!tahunAjaranId || isNaN(tahunAjaranId)) {
      return {
        status: "error",
        message: "ID tahun ajaran harus berupa angka",
        data: null
      };
    }

    const invalidIds = siswaIds.filter(id => !id || isNaN(id));
    if (invalidIds.length > 0) {
      return {
        status: "error",
        message: `ID siswa berikut tidak valid: ${invalidIds.join(', ')}`,
        data: null
      };
    }

    if (siswaIds.length > 50) {
      return {
        status: "error",
        message: "Maksimal 50 siswa dapat ditambahkan sekaligus",
        data: null
      };
    }

    const kelasIdNum = parseInt(kelasId);
    const tahunAjaranIdNum = parseInt(tahunAjaranId);
    const siswaIdsNum = siswaIds.map(id => parseInt(id));
    const result = await bulkTambahSiswaKeKelas(kelasIdNum, siswaIdsNum, tahunAjaranIdNum);

    return {
      status: "success",
      message: `Berhasil menambahkan ${result.summary.success} dari ${result.summary.total} siswa ke kelas`,
      data: result
    };
  } catch (error) {
    console.error("Error in bulkTambahSiswaKeKelasService:", error);

    if (error.message === 'Kelas atau tahun ajaran tidak ditemukan') {
      return {
        status: "error",
        message: "Kelas atau tahun ajaran tidak ditemukan",
        data: null
      };
    }

    if (error.message.includes('Siswa dengan ID') && error.message.includes('tidak ditemukan')) {
      return {
        status: "error",
        message: error.message,
        data: null
      };
    }

    if (error.message.includes('Siswa berikut sudah terdaftar')) {
      return {
        status: "error",
        message: error.message,
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat menambahkan siswa ke kelas",
      data: null
    };
  }
};

export const hapusSiswaDariKelasService = async (kelasId, siswaId, tahunAjaranId) => {
  try {
    if (!kelasId || isNaN(kelasId)) {
      return {
        status: "error",
        message: "ID kelas harus berupa angka",
        data: null
      };
    }

    if (!siswaId || isNaN(siswaId)) {
      return {
        status: "error",
        message: "ID siswa harus berupa angka",
        data: null
      };
    }

    if (!tahunAjaranId || isNaN(tahunAjaranId)) {
      return {
        status: "error",
        message: "ID tahun ajaran harus berupa angka",
        data: null
      };
    }

    const kelasIdNum = parseInt(kelasId);
    const siswaIdNum = parseInt(siswaId);
    const tahunAjaranIdNum = parseInt(tahunAjaranId);
    const result = await hapusSiswaDariKelas(kelasIdNum, siswaIdNum, tahunAjaranIdNum);

    return {
      status: "success",
      message: result.message,
      data: result
    };
  } catch (error) {
    console.error("Error in hapusSiswaDariKelasService:", error);

    if (error.message === 'Siswa tidak ditemukan') {
      return {
        status: "error",
        message: "Siswa tidak ditemukan",
        data: null
      };
    }

    if (error.message === 'Kelas atau tahun ajaran tidak ditemukan') {
      return {
        status: "error",
        message: "Kelas atau tahun ajaran tidak ditemukan",
        data: null
      };
    }

    if (error.message === 'Siswa tidak ditemukan di kelas ini') {
      return {
        status: "error",
        message: "Siswa tidak ditemukan di kelas ini",
        data: null
      };
    }

    if (error.message === 'Gagal menghapus siswa dari kelas') {
      return {
        status: "error",
        message: "Gagal menghapus siswa dari kelas",
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat menghapus siswa dari kelas",
      data: null
    };
  }
};

export const getNaikKelasInfoService = async (kelasId) => {
  try {
    if (!kelasId) {
      return {
        status: "error",
        message: "kelas_id diperlukan",
        data: null
      };
    }

    const kelasIdNum = parseInt(kelasId);

    if (isNaN(kelasIdNum)) {
      return {
        status: "error",
        message: "kelas_id harus berupa angka",
        data: null
      };
    }

    const result = await getNaikKelasInfo(kelasIdNum);

    if (!result.tahun_ajaran_tujuan) {
      return {
        status: "error",
        message: `Tahun ajaran tujuan tidak ditemukan. Silakan buat tahun ajaran ${result.kelas_asal.semester === 'Ganjil' ? result.kelas_asal.tahun + ' - Genap' : 'berikutnya - Ganjil'} terlebih dahulu.`,
        data: result
      };
    }

    return {
      status: "success",
      message: "Data info naik kelas berhasil diambil",
      data: result
    };
  } catch (error) {
    console.error("Error in getNaikKelasInfoService:", error);

    if (error.message === 'Kelas tidak ditemukan') {
      return {
        status: "error",
        message: "Kelas tidak ditemukan",
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil info naik kelas",
      data: null
    };
  }
};

export const executeNaikKelasService = async (kelasAsalId, kelasTujuanId, tahunAjaranTujuanId, siswaIds) => {
  try {
    if (!kelasAsalId) {
      return {
        status: "error",
        message: "kelas_asal_id diperlukan",
        data: null
      };
    }

    if (!kelasTujuanId) {
      return {
        status: "error",
        message: "kelas_tujuan_id diperlukan",
        data: null
      };
    }

    if (!tahunAjaranTujuanId) {
      return {
        status: "error",
        message: "tahun_ajaran_tujuan_id diperlukan",
        data: null
      };
    }

    if (!siswaIds || !Array.isArray(siswaIds) || siswaIds.length === 0) {
      return {
        status: "error",
        message: "siswa_ids harus berupa array dan tidak boleh kosong",
        data: null
      };
    }

    if (siswaIds.length > 100) {
      return {
        status: "error",
        message: "Maksimal 100 siswa per request",
        data: null
      };
    }

    const invalidIds = siswaIds.filter(id => isNaN(parseInt(id)));
    if (invalidIds.length > 0) {
      return {
        status: "error",
        message: "Semua siswa_ids harus berupa angka",
        data: null
      };
    }

    const kelasAsalIdNum = parseInt(kelasAsalId);
    const kelasTujuanIdNum = parseInt(kelasTujuanId);
    const tahunAjaranTujuanIdNum = parseInt(tahunAjaranTujuanId);
    const siswaIdsNum = siswaIds.map(id => parseInt(id));

    const result = await executeNaikKelas(kelasAsalIdNum, kelasTujuanIdNum, tahunAjaranTujuanIdNum, siswaIdsNum);

    return {
      status: "success",
      message: `Berhasil menaikkan ${result.summary.berhasil} siswa dari ${result.summary.kelas_asal} ke ${result.summary.kelas_tujuan}`,
      data: result
    };
  } catch (error) {
    console.error("Error in executeNaikKelasService:", error);

    if (error.message === 'Kelas asal tidak ditemukan') {
      return {
        status: "error",
        message: "Kelas asal tidak ditemukan",
        data: null
      };
    }

    if (error.message === 'Kelas tujuan atau tahun ajaran tujuan tidak ditemukan') {
      return {
        status: "error",
        message: "Kelas tujuan atau tahun ajaran tujuan tidak ditemukan",
        data: null
      };
    }

    if (error.message === 'Beberapa siswa tidak ditemukan') {
      return {
        status: "error",
        message: "Beberapa siswa tidak ditemukan",
        data: null
      };
    }

    if (error.message.includes('tidak terdaftar di kelas asal')) {
      return {
        status: "error",
        message: error.message,
        data: null
      };
    }

    if (error.message.includes('sudah terdaftar di kelas')) {
      return {
        status: "error",
        message: error.message,
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat menaikkan siswa ke kelas baru",
      data: null
    };
  }
};

export const getDaftarMataPelajaranKelasService = async (kelasId, tahunAjaranId = null, page = 1, limit = 20) => {
  try {
    if (!kelasId) {
      return {
        status: "error",
        message: "kelas_id diperlukan",
        data: null
      };
    }

    if (isNaN(parseInt(kelasId))) {
      return {
        status: "error",
        message: "kelas_id harus berupa angka",
        data: null
      };
    }

    if (tahunAjaranId && isNaN(parseInt(tahunAjaranId))) {
      return {
        status: "error",
        message: "tahun_ajaran_id harus berupa angka",
        data: null
      };
    }

    if (isNaN(parseInt(page)) || parseInt(page) < 1) {
      return {
        status: "error",
        message: "page harus berupa angka positif",
        data: null
      };
    }

    if (isNaN(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 100) {
      return {
        status: "error",
        message: "limit harus berupa angka antara 1-100",
        data: null
      };
    }

    const kelasIdNum = parseInt(kelasId);
    const tahunAjaranIdNum = tahunAjaranId ? parseInt(tahunAjaranId) : null;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const result = await getDaftarMataPelajaranKelas(kelasIdNum, tahunAjaranIdNum, pageNum, limitNum);

    return {
      status: "success",
      message: "Data mata pelajaran berhasil diambil",
      data: result
    };
  } catch (error) {
    console.error("Error in getDaftarMataPelajaranKelasService:", error);

    if (error.message === 'Kelas tidak ditemukan') {
      return {
        status: "error",
        message: "Kelas tidak ditemukan",
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil data mata pelajaran",
      data: null
    };
  }
};

export const getDropdownMataPelajaranService = async (kelasId = null, tahunAjaranId = null) => {
  try {
    if (kelasId && isNaN(parseInt(kelasId))) {
      return {
        status: "error",
        message: "kelas_id harus berupa angka",
        data: null
      };
    }

    if (tahunAjaranId && isNaN(parseInt(tahunAjaranId))) {
      return {
        status: "error",
        message: "tahun_ajaran_id harus berupa angka",
        data: null
      };
    }

    const kelasIdNum = kelasId ? parseInt(kelasId) : null;
    const tahunAjaranIdNum = tahunAjaranId ? parseInt(tahunAjaranId) : null;

    const result = await getDropdownMataPelajaran(kelasIdNum, tahunAjaranIdNum);

    return {
      status: "success",
      message: "Data dropdown mata pelajaran berhasil diambil",
      data: result
    };
  } catch (error) {
    console.error("Error in getDropdownMataPelajaranService:", error);

    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil data dropdown mata pelajaran",
      data: null
    };
  }
};

export const getDropdownGuruService = async () => {
  try {
    const result = await getDropdownGuru();

    return {
      status: "success",
      message: "Data dropdown guru berhasil diambil",
      data: result
    };
  } catch (error) {
    console.error("Error in getDropdownGuruService:", error);

    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil data dropdown guru",
      data: null
    };
  }
};

export const getDropdownGuruEditService = async (excludeGuruId) => {
  try {
    if (!excludeGuruId || isNaN(excludeGuruId)) {
      return {
        status: "error",
        message: "exclude_guru_id harus berupa angka",
        data: null
      };
    }

    const result = await getDropdownGuruEdit(excludeGuruId);

    return {
      status: "success",
      message: "Data dropdown guru untuk edit berhasil diambil",
      data: result
    };
  } catch (error) {
    console.error("Error in getDropdownGuruEditService:", error);

    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil data dropdown guru untuk edit",
      data: null
    };
  }
};

export const tambahMataPelajaranKeKelasService = async (kelasId, mapelId, guruId, tahunAjaranId) => {
  try {
    if (!kelasId) {
      return {
        status: "error",
        message: "kelas_id diperlukan",
        data: null
      };
    }

    if (!mapelId) {
      return {
        status: "error",
        message: "mapel_id diperlukan",
        data: null
      };
    }

    if (!guruId) {
      return {
        status: "error",
        message: "guru_id diperlukan",
        data: null
      };
    }

    if (!tahunAjaranId) {
      return {
        status: "error",
        message: "tahun_ajaran_id diperlukan",
        data: null
      };
    }

    if (isNaN(parseInt(kelasId)) || isNaN(parseInt(mapelId)) || isNaN(parseInt(guruId)) || isNaN(parseInt(tahunAjaranId))) {
      return {
        status: "error",
        message: "Semua ID harus berupa angka",
        data: null
      };
    }

    const kelasIdNum = parseInt(kelasId);
    const mapelIdNum = parseInt(mapelId);
    const guruIdNum = parseInt(guruId);
    const tahunAjaranIdNum = parseInt(tahunAjaranId);

    const result = await tambahMataPelajaranKeKelas(kelasIdNum, mapelIdNum, guruIdNum, tahunAjaranIdNum);

    return {
      status: "success",
      message: "Mata pelajaran berhasil ditambahkan ke kelas",
      data: result
    };
  } catch (error) {
    console.error("Error in tambahMataPelajaranKeKelasService:", error);

    if (error.message === 'Mata pelajaran sudah terdaftar di kelas ini untuk tahun ajaran yang sama') {
      return {
        status: "error",
        message: error.message,
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat menambahkan mata pelajaran ke kelas",
      data: null
    };
  }
};

export const tambahMataPelajaranBaruService = async (namaMapel) => {
  try {
    if (!namaMapel) {
      return {
        status: "error",
        message: "nama_mapel diperlukan",
        data: null
      };
    }

    if (typeof namaMapel !== 'string' || namaMapel.trim().length === 0) {
      return {
        status: "error",
        message: "nama_mapel harus berupa string dan tidak boleh kosong",
        data: null
      };
    }

    const namaMapelTrimmed = namaMapel.trim();
    if (namaMapelTrimmed.length < 2) {
      return {
        status: "error",
        message: "nama_mapel minimal 2 karakter",
        data: null
      };
    }

    if (namaMapelTrimmed.length > 50) {
      return {
        status: "error",
        message: "nama_mapel maksimal 50 karakter",
        data: null
      };
    }

    const result = await tambahMataPelajaranBaru(namaMapelTrimmed);

    return {
      status: "success",
      message: "Mata pelajaran baru berhasil ditambahkan ke data master",
      data: result
    };
  } catch (error) {
    console.error("Error in tambahMataPelajaranBaruService:", error);

    if (error.message === 'Mata pelajaran dengan nama ini sudah ada') {
      return {
        status: "error",
        message: error.message,
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat menambahkan mata pelajaran baru",
      data: null
    };
  }
};

export const getDetailMataPelajaranKelasService = async (kelasId, mapelId) => {
  try {
    if (!kelasId || isNaN(kelasId)) {
      return {
        status: "error",
        message: "kelas_id harus berupa angka",
        data: null
      };
    }

    if (!mapelId || isNaN(mapelId)) {
      return {
        status: "error",
        message: "mapel_id harus berupa angka",
        data: null
      };
    }

    const result = await getDetailMataPelajaranKelas(kelasId, mapelId);

    return {
      status: "success",
      message: "Detail mata pelajaran berhasil diambil",
      data: result
    };
  } catch (error) {
    console.error("Error in getDetailMataPelajaranKelasService:", error);

    if (error.message === 'Mata pelajaran tidak ditemukan di kelas ini') {
      return {
        status: "error",
        message: error.message,
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil detail mata pelajaran",
      data: null
    };
  }
};

export const getDropdownMataPelajaranEditService = async (kelasId, tahunAjaranId, excludeMapelId) => {
  try {
    if (!kelasId || isNaN(kelasId)) {
      return {
        status: "error",
        message: "kelas_id harus berupa angka",
        data: null
      };
    }

    if (!tahunAjaranId || isNaN(tahunAjaranId)) {
      return {
        status: "error",
        message: "tahun_ajaran_id harus berupa angka",
        data: null
      };
    }

    if (!excludeMapelId || isNaN(excludeMapelId)) {
      return {
        status: "error",
        message: "exclude_mapel_id harus berupa angka",
        data: null
      };
    }

    const result = await getDropdownMataPelajaranEdit(kelasId, tahunAjaranId, excludeMapelId);

    return {
      status: "success",
      message: "Dropdown mata pelajaran untuk edit berhasil diambil",
      data: result
    };
  } catch (error) {
    console.error("Error in getDropdownMataPelajaranEditService:", error);

    return {
      status: "error",
      message: "Terjadi kesalahan saat mengambil dropdown mata pelajaran untuk edit",
      data: null
    };
  }
};

export const updateMataPelajaranKelasService = async (kelasId, mapelId, newMapelId, guruId, tahunAjaranId) => {
  try {
    if (!kelasId || isNaN(kelasId)) {
      return {
        status: "error",
        message: "kelas_id harus berupa angka",
        data: null
      };
    }

    if (!mapelId || isNaN(mapelId)) {
      return {
        status: "error",
        message: "mapel_id harus berupa angka",
        data: null
      };
    }

    if (!newMapelId || isNaN(newMapelId)) {
      return {
        status: "error",
        message: "new_mapel_id harus berupa angka",
        data: null
      };
    }

    if (!guruId || isNaN(guruId)) {
      return {
        status: "error",
        message: "guru_id harus berupa angka",
        data: null
      };
    }

    if (!tahunAjaranId || isNaN(tahunAjaranId)) {
      return {
        status: "error",
        message: "tahun_ajaran_id harus berupa angka",
        data: null
      };
    }

    const result = await updateMataPelajaranKelas(kelasId, mapelId, newMapelId, guruId, tahunAjaranId);

    return {
      status: "success",
      message: "Mata pelajaran berhasil diperbarui",
      data: result
    };
  } catch (error) {
    console.error("Error in updateMataPelajaranKelasService:", error);
    if (error.message === 'Mata pelajaran ini sudah ada di kelas ini') {
      return {
        status: "error",
        message: error.message,
        data: null
      };
    }

    if (error.message === 'Mata pelajaran tidak ditemukan di kelas ini') {
      return {
        status: "error",
        message: error.message,
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat memperbarui mata pelajaran",
      data: null
    };
  }
};

export const hapusMataPelajaranKelasService = async (kelasId, mapelId) => {
  try {
    if (!kelasId || isNaN(kelasId)) {
      return {
        status: "error",
        message: "kelas_id harus berupa angka",
        data: null
      };
    }

    if (!mapelId || isNaN(mapelId)) {
      return {
        status: "error",
        message: "mapel_id harus berupa angka",
        data: null
      };
    }

    const result = await hapusMataPelajaranKelas(kelasId, mapelId);

    return {
      status: "success",
      message: result.message,
      data: result
    };
  } catch (error) {
    console.error("Error in hapusMataPelajaranKelasService:", error);

    if (error.message === 'Mata pelajaran tidak ditemukan di kelas ini') {
      return {
        status: "error",
        message: error.message,
        data: null
      };
    }

    if (error.message === 'Gagal menghapus mata pelajaran dari kelas') {
      return {
        status: "error",
        message: error.message,
        data: null
      };
    }

    return {
      status: "error",
      message: "Terjadi kesalahan saat menghapus mata pelajaran",
      data: null
    };
  }
};
