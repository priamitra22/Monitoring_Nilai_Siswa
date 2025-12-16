import catatanService from '../../services/ortu/catatanService.js'

export const getStatistik = async (req, res, next) => {
  try {
    const siswaId = req.user.siswa_id

    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan dalam token',
      })
    }

    const data = await catatanService.getStatistikService(siswaId)

    res.status(200).json({
      status: 'success',
      message: 'Statistik catatan berhasil diambil',
      data: data,
    })
  } catch (error) {
    console.error('Error in getStatistik:', error)
    next(error)
  }
}

export const getCatatanList = async (req, res, next) => {
  try {
    const siswaId = req.user.siswa_id

    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan dalam token',
      })
    }

    const filters = {
      page: req.query.page,
      per_page: req.query.per_page,
      search: req.query.search,
      kategori: req.query.kategori,
      jenis: req.query.jenis,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order,
    }

    const data = await catatanService.getCatatanListService(siswaId, filters)

    res.status(200).json({
      status: 'success',
      message: 'Data catatan berhasil diambil',
      data: data,
    })
  } catch (error) {
    if (
      error.message.includes('tidak valid') ||
      error.message.includes('harus') ||
      error.message.includes('Pilih')
    ) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      })
    }

    console.error('Error in getCatatanList:', error)
    next(error)
  }
}

export const getCatatanDetail = async (req, res, next) => {
  try {
    const siswaId = req.user.siswa_id

    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan dalam token',
      })
    }

    const { id } = req.params

    const data = await catatanService.getCatatanDetailService(id, siswaId)

    res.status(200).json({
      status: 'success',
      message: 'Detail catatan berhasil diambil',
      data: data,
    })
  } catch (error) {
    if (error.message === 'Catatan tidak ditemukan') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      })
    }

    if (error.message.includes('tidak memiliki akses')) {
      return res.status(403).json({
        status: 'error',
        message: error.message,
      })
    }

    console.error('Error in getCatatanDetail:', error)
    next(error)
  }
}

export const addCatatanReply = async (req, res, next) => {
  try {
    const siswaId = req.user.siswa_id
    const userId = req.user.id

    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan dalam token',
      })
    }

    const { id } = req.params

    const data = await catatanService.addCatatanReplyService(id, siswaId, userId, req.body)

    res.status(201).json({
      status: 'success',
      message: data.message,
      data: {
        reply_id: data.reply_id,
        catatan: data.catatan,
      },
    })
  } catch (error) {
    if (
      error.message.includes('tidak boleh kosong') ||
      error.message.includes('harus diisi') ||
      error.message.includes('terlalu panjang')
    ) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      })
    }

    if (error.message === 'Catatan tidak ditemukan') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      })
    }

    if (error.message.includes('tidak memiliki akses')) {
      return res.status(403).json({
        status: 'error',
        message: error.message,
      })
    }

    console.error('Error in addCatatanReply:', error)
    next(error)
  }
}

export default {
  getStatistik,
  getCatatanList,
  getCatatanDetail,
  addCatatanReply,
}
