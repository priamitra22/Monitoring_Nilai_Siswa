import nilaiService from '../../services/ortu/nilaiService.js'

const getSiswaId = async (req) => {
  if (!req.user || !req.user.siswa_id) {
    throw new Error('Siswa ID tidak ditemukan. Pastikan Anda login sebagai orang tua.')
  }
  return req.user.siswa_id
}

export const getTahunAjaran = async (req, res, next) => {
  try {
    const siswaId = await getSiswaId(req)

    const data = await nilaiService.getTahunAjaranService(siswaId)

    res.status(200).json({
      status: 'success',
      data,
    })
  } catch (error) {
    console.error('Error in getTahunAjaran:', error.message)

    if (error.message === 'Siswa ID tidak ditemukan. Pastikan Anda login sebagai orang tua.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null,
      })
    }

    next(error)
  }
}

export const getSemester = async (req, res, next) => {
  try {
    const siswaId = await getSiswaId(req)
    const { tahun_ajaran } = req.query

    if (!tahun_ajaran) {
      return res.status(400).json({
        status: 'error',
        message: 'tahun_ajaran wajib diisi',
        data: null,
      })
    }

    const data = await nilaiService.getSemesterService(siswaId, tahun_ajaran)

    res.status(200).json({
      status: 'success',
      data,
    })
  } catch (error) {
    console.error('Error in getSemester:', error.message)

    if (error.message === 'Siswa ID tidak ditemukan. Pastikan Anda login sebagai orang tua.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null,
      })
    }

    next(error)
  }
}

export const getNilaiDetail = async (req, res, next) => {
  try {
    const siswaId = await getSiswaId(req)
    let { tahun_ajaran_id, semester } = req.query

    if (!tahun_ajaran_id) {
      return res.status(400).json({
        status: 'error',
        message: 'tahun_ajaran_id wajib diisi',
        data: null,
      })
    }

    if (!semester) {
      return res.status(400).json({
        status: 'error',
        message: 'semester wajib diisi',
        data: null,
      })
    }

    if (semester === '1') {
      semester = 'Ganjil'
    } else if (semester === '2') {
      semester = 'Genap'
    }

    if (semester !== 'Ganjil' && semester !== 'Genap') {
      return res.status(400).json({
        status: 'error',
        message: 'semester harus "Ganjil", "Genap", "1", atau "2"',
        data: null,
      })
    }

    const data = await nilaiService.getNilaiDetailService(siswaId, tahun_ajaran_id, semester)

    res.status(200).json({
      status: 'success',
      data: data || [],
    })
  } catch (error) {
    console.error('Error in getNilaiDetail:', error.message)

    if (error.message === 'Siswa ID tidak ditemukan. Pastikan Anda login sebagai orang tua.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null,
      })
    }

    next(error)
  }
}

export default {
  getTahunAjaran,
  getSemester,
  getNilaiDetail,
}
