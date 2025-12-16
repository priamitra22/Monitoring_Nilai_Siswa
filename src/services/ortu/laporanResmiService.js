import * as laporanResmiModel from '../../models/ortu/laporanResmiModel.js'

export const getAllLaporanService = async (ortuId) => {
    try {
        if (!ortuId) {
            throw new Error('Ortu ID tidak ditemukan')
        }

        const siswa = await laporanResmiModel.getSiswaByOrtuId(ortuId)

        if (!siswa) {
            throw new Error('Data siswa tidak ditemukan')
        }

        const laporan = await laporanResmiModel.getAllLaporanBySiswa(siswa.siswa_id)

        const formattedLaporan = laporan.map((item) => ({
            ...item,
            is_latest: Boolean(item.is_latest),
        }))

        return formattedLaporan
    } catch (error) {
        console.error('Error in getAllLaporanService:', error)
        throw error
    }
}

export const getLaporanByIdService = async (laporanId, ortuId) => {
    try {
        if (!laporanId) {
            throw new Error('Laporan ID tidak valid')
        }

        if (!ortuId) {
            throw new Error('Ortu ID tidak ditemukan')
        }

        const laporan = await laporanResmiModel.getLaporanById(laporanId)

        if (!laporan) {
            throw new Error('Laporan tidak ditemukan')
        }

        if (laporan.orangtua_id !== ortuId) {
            throw new Error('Anda tidak memiliki akses untuk mengunduh laporan ini')
        }

        return laporan
    } catch (error) {
        console.error('Error in getLaporanByIdService:', error)
        throw error
    }
}

export default {
    getAllLaporanService,
    getLaporanByIdService,
}
