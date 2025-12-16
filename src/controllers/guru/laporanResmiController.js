import {
  fetchLaporanByGuru,
  fetchKelasByGuru,
  downloadLaporan,
  fetchVersionHistory,
} from '../../services/guru/laporanResmiService.js'
import path from 'path'
import fs from 'fs'

export const getLaporanList = async (req, res) => {
  try {
    const guruId = req.user.guru_id
    const filters = req.query

    if (!filters.kelas_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter kelas_id wajib diisi',
      })
    }

    const result = await fetchLaporanByGuru(guruId, filters)

    if (result.status === 'error') {
      return res.status(400).json(result)
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('Error in getLaporanList:', error)
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan server',
    })
  }
}

export const getKelasOptions = async (req, res) => {
  try {
    const guruId = req.user.guru_id
    const { tahun_ajaran_id } = req.query
    if (!tahun_ajaran_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter tahun_ajaran_id wajib diisi',
      })
    }

    const result = await fetchKelasByGuru(guruId, tahun_ajaran_id)

    res.status(200).json(result)
  } catch (error) {
    console.error('Error in getKelasOptions:', error)
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan server',
    })
  }
}

export const downloadLaporanFile = async (req, res) => {
  try {
    const { id } = req.params
    const guruId = req.user.guru_id

    const result = await downloadLaporan(id, guruId)

    if (result.status === 'error') {
      return res.status(404).json(result)
    }

    const laporan = result.data
    const filePath = path.join(process.cwd(), laporan.file_path)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: 'error',
        message: 'File tidak ditemukan',
      })
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${laporan.original_filename}"`)

    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
  } catch (error) {
    console.error('Error in downloadLaporanFile:', error)
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengunduh file',
    })
  }
}

export const getVersionHistory = async (req, res) => {
  try {
    const { siswa_id } = req.params
    const guruId = req.user.guru_id

    const result = await fetchVersionHistory(siswa_id, guruId)

    if (result.status === 'error') {
      return res.status(403).json(result)
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('Error in getVersionHistory:', error)
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan server',
    })
  }
}
