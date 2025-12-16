import {
  fetchAllLaporanResmi,
  fetchLaporanResmiDetail,
  fetchVersionHistory,
  uploadLaporanResmi,
  updateLaporanResmiService,
  deleteLaporanResmiService,
} from '../../services/admin/laporanResmiService.js'
import { downloadFromCloudinary } from '../../config/cloudinaryConfig.js'
import path from 'path'
import fs from 'fs'

export const getAllLaporanResmi = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      tahun_ajaran_id = '',
      kelas_id = '',
      semester = '',
      sort_by = 'upload_date',
      sort_order = 'desc',
    } = req.query

    const result = await fetchAllLaporanResmi(
      page,
      limit,
      search,
      tahun_ajaran_id,
      kelas_id,
      semester,
      sort_by,
      sort_order
    )

    if (result.status === 'error') {
      return res.status(400).json(result)
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('Error in getAllLaporanResmi controller:', error)
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan server',
      data: null,
    })
  }
}

export const getLaporanDetail = async (req, res) => {
  try {
    const { id } = req.params

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'ID laporan tidak valid',
        data: null,
      })
    }

    const result = await fetchLaporanResmiDetail(id)

    if (result.status === 'error') {
      return res.status(404).json(result)
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('Error in getLaporanDetail controller:', error)
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan server',
      data: null,
    })
  }
}

export const getVersionHistory = async (req, res) => {
  try {
    const { siswa_id } = req.params

    if (!siswa_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan',
        data: null,
      })
    }

    const result = await fetchVersionHistory(siswa_id)

    if (result.status === 'error') {
      return res.status(404).json(result)
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('Error in getVersionHistory controller:', error)
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan server',
      data: null,
    })
  }
}

export const uploadLaporan = async (req, res) => {
  try {
    const userId = req.user.id
    const file = req.file
    const data = req.body

    const result = await uploadLaporanResmi(data, file, userId)

    if (result.status === 'error') {
      return res.status(400).json(result)
    }

    res.status(201).json(result)
  } catch (error) {
    console.error('Error in uploadLaporan controller:', error)

    if (req.file) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError)
      }
    }

    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan server saat upload',
      data: null,
    })
  }
}

export const updateLaporan = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const file = req.file
    const { keterangan } = req.body

    if (!id || isNaN(id)) {
      if (file) {
        fs.unlinkSync(file.path)
      }
      return res.status(400).json({
        status: 'error',
        message: 'ID laporan tidak valid',
        data: null,
      })
    }

    const result = await updateLaporanResmiService(id, file, keterangan, userId)

    if (result.status === 'error') {
      return res.status(400).json(result)
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('Error in updateLaporan controller:', error)

    if (req.file) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError)
      }
    }

    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan server saat update',
      data: null,
    })
  }
}

export const deleteLaporan = async (req, res) => {
  try {
    const { id } = req.params

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'ID laporan tidak valid',
        data: null,
      })
    }

    const result = await deleteLaporanResmiService(id)

    if (result.status === 'error') {
      return res.status(404).json(result)
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('Error in deleteLaporan controller:', error)
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan server',
      data: null,
    })
  }
}

export const downloadLaporan = async (req, res) => {
  try {
    const { id } = req.params

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'ID laporan tidak valid',
        data: null,
      })
    }

    const result = await fetchLaporanResmiDetail(id)

    if (result.status === 'error') {
      return res.status(404).json(result)
    }

    const laporan = result.data
    const downloadFilename = `${laporan.nama_siswa.replace(/\s+/g, '_')}_v${laporan.version}.pdf`

    if (laporan.file_path.includes('cloudinary') || laporan.file_path.includes('res.cloudinary.com')) {
      try {
        const urlParts = laporan.file_path.split('/upload/')
        if (urlParts.length < 2) {
          throw new Error('Invalid Cloudinary URL format')
        }
        const pathAfterUpload = urlParts[1].replace(/^v\d+\//, '')

        const downloadResult = await downloadFromCloudinary(pathAfterUpload)

        if (!downloadResult.success) {
          return res.status(404).json({
            status: 'error',
            message: 'File tidak ditemukan di cloud storage',
            data: null,
          })
        }

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`)

        return res.send(downloadResult.buffer)
      } catch (fetchError) {
        console.error('Error fetching from Cloudinary:', fetchError)
        return res.status(500).json({
          status: 'error',
          message: 'Gagal mengunduh file dari cloud storage',
          data: null,
        })
      }
    }

    const filePath = path.join(process.cwd(), laporan.file_path)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: 'error',
        message: 'File tidak ditemukan',
        data: null,
      })
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`)
    res.setHeader('Content-Length', laporan.file_size)

    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error)
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'Gagal mengunduh file',
          data: null,
        })
      }
    })
  } catch (error) {
    console.error('Error in downloadLaporan controller:', error)
    if (!res.headersSent) {
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server',
        data: null,
      })
    }
  }
}
