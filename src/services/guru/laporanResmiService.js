import {
  getLaporanByGuru,
  getKelasByGuru,
  getLaporanById,
  getVersionHistory,
} from '../../models/guru/laporanResmiModel.js'

export const fetchLaporanByGuru = async (guruId, filters) => {
  try {
    const { kelas_id, page = 1, limit = 10, search = '' } = filters

    const result = await getLaporanByGuru(guruId, kelas_id, parseInt(page), parseInt(limit), search)

    return {
      status: 'success',
      message: 'Data laporan berhasil diambil',
      data: result,
    }
  } catch (error) {
    console.error('Error in fetchLaporanByGuru:', error)
    return {
      status: 'error',
      message: 'Gagal mengambil data laporan',
      data: null,
    }
  }
}

export const fetchKelasByGuru = async (guruId, tahunAjaranId) => {
  try {
    const kelas = await getKelasByGuru(guruId, tahunAjaranId)

    return {
      status: 'success',
      data: kelas,
    }
  } catch (error) {
    console.error('Error in fetchKelasByGuru:', error)
    return {
      status: 'error',
      message: 'Gagal mengambil data kelas',
      data: [],
    }
  }
}

export const downloadLaporan = async (id, guruId) => {
  try {
    const laporan = await getLaporanById(id, guruId)

    if (!laporan) {
      return {
        status: 'error',
        message: 'Laporan tidak ditemukan atau Anda tidak memiliki akses',
      }
    }

    return {
      status: 'success',
      data: laporan,
    }
  } catch (error) {
    console.error('Error in downloadLaporan:', error)
    return {
      status: 'error',
      message: 'Gagal mengunduh laporan',
    }
  }
}

export const fetchVersionHistory = async (siswaId, guruId) => {
  try {
    const versions = await getVersionHistory(siswaId, guruId)

    return {
      status: 'success',
      data: {
        versions,
      },
    }
  } catch (error) {
    console.error('Error in fetchVersionHistory:', error)
    return {
      status: 'error',
      message: error.message || 'Gagal mengambil riwayat versi',
    }
  }
}
