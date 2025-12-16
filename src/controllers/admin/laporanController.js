import laporanService from '../../services/admin/laporanService.js'

export const getDaftarSiswa = async (req, res, next) => {
  try {
    const { kelas_id, tahun_ajaran_id, search } = req.query

    const data = await laporanService.getDaftarSiswaService({
      kelas_id: kelas_id ? parseInt(kelas_id) : null,
      tahun_ajaran_id: tahun_ajaran_id ? parseInt(tahun_ajaran_id) : null,
      search: search || null,
    })

    res.status(200).json({
      status: 'success',
      data,
    })
  } catch (error) {
    next(error)
  }
}

export const getTranskripNilai = async (req, res, next) => {
  try {
    const { siswa_id } = req.params

    if (!siswa_id) {
      return res.status(400).json({
        success: false,
        message: 'Parameter siswa_id wajib diisi',
        data: null,
      })
    }

    const data = await laporanService.getTranskripNilaiService(parseInt(siswa_id))

    res.status(200).json({
      success: true,
      message: 'Transkrip nilai berhasil diambil',
      data,
    })
  } catch (error) {
    next(error)
  }
}

export const downloadTranskripPDF = async (req, res, next) => {
  try {
    const { siswa_id } = req.params

    if (!siswa_id) {
      return res.status(400).json({
        success: false,
        message: 'Parameter siswa_id wajib diisi',
        data: null,
      })
    }

    const pdfBuffer = await laporanService.generateTranskripPDFService(parseInt(siswa_id))

    const transkripData = await laporanService.getTranskripNilaiService(parseInt(siswa_id))
    const siswaName = transkripData.siswa.nama.replace(/\s+/g, '_')
    const siswanis = transkripData.siswa.nisn

    const filename = `Transkrip_${siswaName}_${siswanis}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    res.send(pdfBuffer)
  } catch (error) {
    if (error.message === 'Data siswa tidak ditemukan') {
      return res.status(404).json({
        success: false,
        message: 'Data transkrip tidak ditemukan',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Gagal generate PDF',
      error: error.message,
    })
  }
}

export const getTahunAjaranDropdown = async (req, res, next) => {
  try {
    const data = await laporanService.getTahunAjaranDropdownService()

    res.status(200).json({
      success: true,
      data,
    })
  } catch (error) {
    next(error)
  }
}

export const getKelasDropdown = async (req, res, next) => {
  try {
    const { tahun_ajaran_id } = req.query

    if (!tahun_ajaran_id) {
      return res.status(400).json({
        success: false,
        message: 'Parameter tahun_ajaran_id wajib diisi',
      })
    }

    const data = await laporanService.getKelasDropdownService(parseInt(tahun_ajaran_id))

    res.status(200).json({
      success: true,
      data,
    })
  } catch (error) {
    next(error)
  }
}

export const getSiswaDropdown = async (req, res, next) => {
  try {
    const { kelas_id, tahun_ajaran_id } = req.query

    if (!kelas_id) {
      return res.status(400).json({
        success: false,
        message: 'Parameter kelas_id wajib diisi',
      })
    }

    if (!tahun_ajaran_id) {
      return res.status(400).json({
        success: false,
        message: 'Parameter tahun_ajaran_id wajib diisi',
      })
    }

    const data = await laporanService.getSiswaDropdownService(
      parseInt(kelas_id),
      parseInt(tahun_ajaran_id)
    )

    res.status(200).json({
      success: true,
      data,
    })
  } catch (error) {
    next(error)
  }
}


export const downloadBulkTranskrip = async (req, res, next) => {
  try {
    const { kelas_id, tahun_ajaran_id } = req.body

    if (!kelas_id) {
      return res.status(400).json({
        success: false,
        message: 'Parameter kelas_id wajib diisi',
      })
    }

    if (!tahun_ajaran_id) {
      return res.status(400).json({
        success: false,
        message: 'Parameter tahun_ajaran_id wajib diisi',
      })
    }

    const { buffer, filename, totalSiswa } = await laporanService.generateBulkTranskripService(
      parseInt(kelas_id),
      parseInt(tahun_ajaran_id)
    )

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', buffer.length)
    res.setHeader('X-Total-Siswa', totalSiswa)

    res.send(buffer)
  } catch (error) {
    if (error.message.includes('tidak ditemukan') || error.message.includes('Tidak ada siswa')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Gagal generate bulk transkrip',
    })
  }
}

export default {
  getDaftarSiswa,
  getTranskripNilai,
  downloadTranskripPDF,
  getTahunAjaranDropdown,
  getKelasDropdown,
  getSiswaDropdown,
  downloadBulkTranskrip,
}
