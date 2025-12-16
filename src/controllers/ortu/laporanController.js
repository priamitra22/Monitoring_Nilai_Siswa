import * as laporanService from '../../services/ortu/laporanService.js'

export const getTahunAjaran = async (req, res, next) => {
  try {
    if (req.user.role !== 'ortu') {
      return res.status(403).json({
        status: 'error',
        message: 'Akses ditolak. Hanya orang tua yang dapat mengakses endpoint ini.',
      })
    }
    const siswaId = req.user.siswa_id
    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Data siswa tidak ditemukan dalam token. Silakan login ulang.',
      })
    }
    const data = await laporanService.getTahunAjaranService(siswaId)
    res.status(200).json({
      status: 'success',
      data: data,
    })
  } catch (error) {
    console.error('Error in getTahunAjaran controller:', error)
    next(error)
  }
}

export const getSemester = async (req, res, next) => {
  try {
    if (req.user.role !== 'ortu') {
      return res.status(403).json({
        status: 'error',
        message: 'Akses ditolak. Hanya orang tua yang dapat mengakses endpoint ini.',
      })
    }
    const siswaId = req.user.siswa_id
    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Data siswa tidak ditemukan dalam token. Silakan login ulang.',
      })
    }
    const { tahun_ajaran } = req.query
    if (!tahun_ajaran) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter tahun_ajaran wajib diisi',
      })
    }

    const data = await laporanService.getSemesterService(siswaId, tahun_ajaran)

    res.status(200).json({
      status: 'success',
      data: data,
    })
  } catch (error) {
    console.error('Error in getSemester controller:', error)
    next(error)
  }
}

export const getNilaiLaporan = async (req, res, next) => {
  try {
    if (req.user.role !== 'ortu') {
      return res.status(403).json({
        status: 'error',
        message: 'Akses ditolak. Hanya orang tua yang dapat mengakses endpoint ini.',
      })
    }
    const siswaId = req.user.siswa_id
    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Data siswa tidak ditemukan dalam token. Silakan login ulang.',
      })
    }
    const { tahun_ajaran_id, semester } = req.query
    if (!tahun_ajaran_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter tahun_ajaran_id wajib diisi',
      })
    }

    if (!semester) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter semester wajib diisi (1 atau 2)',
      })
    }
    const data = await laporanService.getNilaiLaporanService(siswaId, tahun_ajaran_id, semester)

    res.status(200).json({
      status: 'success',
      data: data,
    })
  } catch (error) {
    if (error.message === 'Data siswa tidak ditemukan dalam token') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
      })
    }

    if (error.message === 'Tahun ajaran wajib dipilih') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      })
    }

    if (
      error.message === 'Semester harus 1 atau 2' ||
      error.message === 'Semester harus 1 atau 2 (atau Ganjil/Genap)' ||
      error.message === 'Semester wajib diisi'
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Semester harus 1 atau 2',
      })
    }

    if (error.message === 'Data nilai tidak ditemukan untuk siswa ini') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      })
    }

    console.error('Error in getNilaiLaporan controller:', error)
    next(error)
  }
}

export const downloadPDF = async (req, res, next) => {
  try {
    if (req.user.role !== 'ortu') {
      return res.status(403).json({
        status: 'error',
        message: 'Akses ditolak. Hanya orang tua yang dapat mengakses endpoint ini.',
      })
    }

    const siswaId = req.user.siswa_id
    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Data siswa tidak ditemukan dalam token. Silakan login ulang.',
      })
    }

    const { tahun_ajaran_id, semester } = req.body

    if (!tahun_ajaran_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter tahun_ajaran_id wajib diisi',
      })
    }

    if (!semester) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter semester wajib diisi (1 atau 2)',
      })
    }

    const pdfBuffer = await laporanService.generatePDFLaporanService(
      siswaId,
      tahun_ajaran_id,
      semester
    )

    const laporanData = await laporanService.getNilaiLaporanService(
      siswaId,
      tahun_ajaran_id,
      semester
    )
    const siswaName = (laporanData.siswa?.siswa_nama || 'Siswa').replace(/\s+/g, '_')
    const tahunAjaran = (laporanData.siswa?.tahun_ajaran || '').replace(/\//g, '-')
    const timestamp = new Date().getTime()

    const filename = `Laporan_Nilai_${siswaName}_${tahunAjaran}_Semester_${semester}_${timestamp}.pdf`
    const encodedFilename = encodeURIComponent(filename)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Error in downloadPDF controller:', error)

    if (error.message === 'Data siswa tidak ditemukan dalam token') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
      })
    }

    if (error.message === 'Tahun ajaran wajib dipilih') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      })
    }

    if (
      error.message === 'Semester harus 1 atau 2' ||
      error.message === 'Semester harus 1 atau 2 (atau Ganjil/Genap)' ||
      error.message === 'Semester wajib diisi'
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Semester harus 1 atau 2',
      })
    }

    if (error.message === 'Data nilai tidak ditemukan untuk siswa ini') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      })
    }

    next(error)
  }
}

export default {
  getTahunAjaran,
  getSemester,
  getNilaiLaporan,
  downloadPDF,
}
