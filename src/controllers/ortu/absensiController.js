import absensiService from '../../services/ortu/absensiService.js'

export const getTahunAjaran = async (req, res, next) => {
  try {
    const siswaId = req.user.siswa_id

    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan. Pastikan Anda login sebagai orang tua siswa',
      })
    }

    const data = await absensiService.getTahunAjaranService(siswaId)

    if (!data || data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Data tahun ajaran tidak ditemukan',
      })
    }

    res.status(200).json({
      status: 'success',
      message: 'Data tahun ajaran berhasil diambil',
      data: {
        tahun_ajaran: data,
      },
    })
  } catch (error) {
    console.error('Error in getTahunAjaran:', error)
    next(error)
  }
}

export const getSemester = async (req, res, next) => {
  try {
    const siswaId = req.user.siswa_id

    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan dalam token',
      })
    }

    const tahunAjaran = req.query.tahun_ajaran

    if (!tahunAjaran) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter tahun_ajaran wajib diisi',
      })
    }

    const data = await absensiService.getSemesterService(siswaId, tahunAjaran)

    if (!data || data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Data semester tidak ditemukan',
      })
    }

    res.status(200).json({
      status: 'success',
      message: 'Data semester berhasil diambil',
      data: {
        semester: data,
      },
    })
  } catch (error) {
    console.error('Error in getSemester:', error)
    next(error)
  }
}

export const getBulan = async (req, res, next) => {
  try {
    const siswaId = req.user.siswa_id

    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan dalam token',
      })
    }

    const tahunAjaranId = req.query.tahun_ajaran_id
    const semester = req.query.semester

    if (!tahunAjaranId || !semester) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter tahun_ajaran_id dan semester wajib diisi',
      })
    }

    if (semester !== '1' && semester !== '2') {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter semester harus 1 atau 2',
      })
    }

    const data = await absensiService.getBulanService(siswaId, tahunAjaranId, semester)

    if (!data) {
      return res.status(404).json({
        status: 'error',
        message: 'Data bulan tidak ditemukan',
      })
    }

    res.status(200).json({
      status: 'success',
      message: 'Data bulan berhasil diambil',
      data: data,
    })
  } catch (error) {
    console.error('Error in getBulan:', error)
    next(error)
  }
}


export const getSummary = async (req, res, next) => {
  try {
    const siswaId = req.user.siswa_id

    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan dalam token',
      })
    }

    const tahunAjaranId = req.query.tahun_ajaran_id
    const semester = req.query.semester

    if (!tahunAjaranId || !semester) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter tahun_ajaran_id dan semester wajib diisi',
      })
    }

    if (semester !== '1' && semester !== '2') {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter semester harus 1 atau 2',
      })
    }

    const data = await absensiService.getSummaryService(siswaId, tahunAjaranId, semester)

    if (!data) {
      return res.status(404).json({
        status: 'error',
        message: 'Data absensi tidak ditemukan untuk periode yang dipilih',
      })
    }

    res.status(200).json({
      status: 'success',
      message: 'Summary kehadiran berhasil diambil',
      data: data,
    })
  } catch (error) {
    console.error('Error in getSummary:', error)
    next(error)
  }
}

export const getDetail = async (req, res, next) => {
  try {
    const siswaId = req.user.siswa_id

    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan dalam token',
      })
    }

    const { tahun_ajaran_id, semester, bulan } = req.query

    if (!tahun_ajaran_id || !semester) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter tahun_ajaran_id dan semester wajib diisi',
      })
    }

    if (semester !== '1' && semester !== '2') {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter semester harus 1 atau 2',
      })
    }

    const tahunAjaranId = parseInt(tahun_ajaran_id)

    const data = await absensiService.getDetailService(siswaId, tahunAjaranId, semester, bulan)

    if (!data || !data.absensi || data.absensi.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Data absensi tidak ditemukan untuk periode yang dipilih',
      })
    }

    res.status(200).json({
      status: 'success',
      message: 'Detail absensi berhasil diambil',
      data: data,
    })
  } catch (error) {
    console.error('Error in getDetail:', error)
    next(error)
  }
}

export default {
  getTahunAjaran,
  getSemester,
  getBulan,
  getSummary,
  getDetail,
}
