import {
  getAllTahunAjaran,
  getTahunAjaranAktif,
  getTahunAjaranById,
  createTahunAjaran,
  deleteTahunAjaran,
  checkTahunAjaranUsage,
  checkActiveTahunAjaran,
  checkDuplicateTahunAjaran,
  checkDateOverlap,
  toggleTahunAjaranStatus
} from "../../models/admin/tahunAjaranModel.js";

export const getAllTahunAjaranService = async (sortBy = 'tahun', order = 'DESC') => {
  try {
    const tahunAjaran = await getAllTahunAjaran(sortBy, order);

    return {
      status: "success",
      message: "Data tahun ajaran berhasil diambil",
      data: tahunAjaran
    };
  } catch (error) {
    throw new Error("Gagal mengambil data tahun ajaran: " + error.message);
  }
};

export const getTahunAjaranAktifService = async () => {
  try {
    const tahunAjaranAktif = await getTahunAjaranAktif();

    if (!tahunAjaranAktif) {
      throw new Error("Tidak ada tahun ajaran aktif");
    }

    return {
      status: "success",
      message: "Tahun ajaran aktif berhasil diambil",
      data: tahunAjaranAktif
    };
  } catch (error) {
    throw new Error("Gagal mengambil tahun ajaran aktif: " + error.message);
  }
};

export const getTahunAjaranByIdService = async (id) => {
  try {
    if (!id || isNaN(id)) {
      throw new Error("ID tahun ajaran tidak valid");
    }

    const tahunAjaran = await getTahunAjaranById(id);

    if (!tahunAjaran) {
      throw new Error("Tahun ajaran tidak ditemukan");
    }

    return {
      status: "success",
      message: "Data tahun ajaran berhasil diambil",
      data: tahunAjaran
    };
  } catch (error) {
    throw new Error("Gagal mengambil data tahun ajaran: " + error.message);
  }
};

export const createTahunAjaranService = async (data) => {
  try {
    const { tahun, semester, tanggal_mulai, tanggal_selesai, status } = data;

    if (!tahun || !semester || !tanggal_mulai || !tanggal_selesai) {
      throw new Error("Tahun, semester, tanggal mulai, dan tanggal selesai wajib diisi");
    }

    if (!['Ganjil', 'Genap'].includes(semester)) {
      throw new Error("Semester harus 'Ganjil' atau 'Genap'");
    }

    if (status && !['aktif', 'tidak-aktif'].includes(status)) {
      throw new Error("Status harus 'aktif' atau 'tidak-aktif'");
    }

    const startDate = new Date(tanggal_mulai);
    const endDate = new Date(tanggal_selesai);

    if (startDate >= endDate) {
      throw new Error("Tanggal mulai harus lebih kecil dari tanggal selesai");
    }

    const duplicateCheck = await checkDuplicateTahunAjaran(tahun, semester);
    if (duplicateCheck.duplicate_count > 0) {
      throw new Error(`Tahun ajaran ${tahun} semester ${semester} sudah ada`);
    }

    const overlapCheck = await checkDateOverlap(tanggal_mulai, tanggal_selesai);
    if (overlapCheck.overlap_count > 0) {
      throw new Error("Tanggal yang dipilih overlap dengan tahun ajaran yang sudah ada");
    }

    if (status === 'aktif') {
      const activeCheck = await checkActiveTahunAjaran();
      if (activeCheck.active_count > 0) {
        throw new Error("Sudah ada tahun ajaran aktif. Hanya boleh ada 1 tahun ajaran aktif");
      }
    }

    const result = await createTahunAjaran(data);

    return {
      status: "success",
      message: "Tahun ajaran berhasil dibuat",
      data: result
    };
  } catch (error) {
    throw new Error("Gagal membuat tahun ajaran: " + error.message);
  }
};

export const toggleTahunAjaranStatusService = async (id) => {
  try {
    if (!id || isNaN(id)) {
      throw new Error("ID tahun ajaran tidak valid");
    }

    const tahunAjaran = await getTahunAjaranById(id);

    if (!tahunAjaran) {
      throw new Error("Tahun ajaran tidak ditemukan");
    }

    if (tahunAjaran.status === 'tidak-aktif') {
      const activeCheck = await checkActiveTahunAjaran();
      if (activeCheck.active_count > 0) {
        throw new Error("Sudah ada tahun ajaran aktif. Hanya boleh ada 1 tahun ajaran aktif. Ubah tahun ajaran aktif menjadi tidak aktif terlebih dahulu");
      }
    }

    const result = await toggleTahunAjaranStatus(id);

    return {
      status: "success",
      message: result.message,
      data: {
        id: result.id,
        old_status: result.old_status,
        new_status: result.new_status
      }
    };
  } catch (error) {
    throw new Error("Gagal mengubah status tahun ajaran: " + error.message);
  }
};

export const deleteTahunAjaranService = async (id) => {
  try {
    if (!id || isNaN(id)) {
      throw new Error("ID tahun ajaran tidak valid");
    }

    const tahunAjaran = await getTahunAjaranById(id);

    if (!tahunAjaran) {
      throw new Error("Tahun ajaran tidak ditemukan");
    }

    if (tahunAjaran.status === 'aktif') {
      throw new Error("Tahun ajaran tidak dapat dihapus karena sedang aktif. Ubah status menjadi 'tidak-aktif' terlebih dahulu");
    }

    const usage = await checkTahunAjaranUsage(id);

    if (usage.kelas_count > 0) {
      throw new Error("Tahun ajaran tidak dapat dihapus karena sudah digunakan untuk kelas");
    }

    if (usage.nilai_count > 0) {
      throw new Error("Tahun ajaran tidak dapat dihapus karena sudah digunakan untuk data nilai");
    }

    const result = await deleteTahunAjaran(id);

    return {
      status: "success",
      message: "Tahun ajaran berhasil dihapus",
      data: result
    };
  } catch (error) {
    throw new Error("Gagal menghapus tahun ajaran: " + error.message);
  }
};
