import catatanModel from '../../models/ortu/catatanModel.js'

export const getStatistikService = async (siswaId) => {
  try {
    if (!siswaId) {
      throw new Error('Siswa ID tidak ditemukan')
    }

    const statistik = await catatanModel.getStatistikBySiswa(siswaId)

    return {
      total: Number(statistik.total) || 0,
      positif: Number(statistik.positif) || 0,
      negatif: Number(statistik.negatif) || 0,
      netral: Number(statistik.netral) || 0,
    }
  } catch (error) {
    console.error('Error in getStatistikService:', error)
    throw error
  }
}

export const getCatatanListService = async (siswaId, filters) => {
  try {
    if (!siswaId) {
      throw new Error('Siswa ID tidak boleh kosong')
    }

    const page = parseInt(filters.page) || 1
    const per_page = Math.min(parseInt(filters.per_page) || 10, 100)

    if (page < 1) {
      throw new Error('Parameter page harus lebih dari 0')
    }

    if (per_page < 1) {
      throw new Error('Parameter per_page harus lebih dari 0')
    }

    const validKategori = ['Positif', 'Negatif', 'Netral']
    if (filters.kategori && !validKategori.includes(filters.kategori)) {
      throw new Error('Kategori tidak valid. Pilih: Positif, Negatif, atau Netral')
    }
    const validJenis = ['Akademik', 'Perilaku', 'Kehadiran', 'Prestasi', 'Lainnya']
    if (filters.jenis && !validJenis.includes(filters.jenis)) {
      throw new Error(
        'Jenis tidak valid. Pilih: Akademik, Perilaku, Kehadiran, Prestasi, atau Lainnya'
      )
    }

    const validSortBy = ['tanggal', 'guru_nama', 'kategori', 'jenis', 'status']
    if (filters.sort_by && !validSortBy.includes(filters.sort_by)) {
      throw new Error(
        'Sort by tidak valid. Pilih: tanggal, guru_nama, kategori, jenis, atau status'
      )
    }

    const validSortOrder = ['asc', 'desc']
    if (filters.sort_order && !validSortOrder.includes(filters.sort_order.toLowerCase())) {
      throw new Error('Sort order tidak valid. Pilih: asc atau desc')
    }

    const sanitizedFilters = {
      page,
      per_page,
      search: filters.search || '',
      kategori: filters.kategori || '',
      jenis: filters.jenis || '',
      sort_by: filters.sort_by || 'tanggal',
      sort_order: (filters.sort_order || 'desc').toLowerCase(),
    }

    const result = await catatanModel.getCatatanList(siswaId, sanitizedFilters)

    const total_pages = Math.ceil(result.total / per_page)

    return {
      catatan: result.data,
      pagination: {
        current_page: page,
        per_page: per_page,
        total_data: result.total,
        total_pages: total_pages,
        has_next: page < total_pages,
        has_prev: page > 1,
      },
    }
  } catch (error) {
    console.error('Error in getCatatanListService:', error)
    throw error
  }
}

export const getCatatanDetailService = async (catatanId, siswaId) => {
  try {
    if (!catatanId) {
      throw new Error('Catatan ID tidak boleh kosong')
    }

    if (!siswaId) {
      throw new Error('Siswa ID tidak boleh kosong')
    }

    const catatan = await catatanModel.getCatatanDetail(catatanId)

    if (!catatan) {
      throw new Error('Catatan tidak ditemukan')
    }

    if (catatan.siswa_id !== siswaId) {
      throw new Error('Anda tidak memiliki akses ke catatan ini')
    }
    const replies = await catatanModel.getCatatanReplies(catatanId)
    if (catatan.status === 'Terkirim') {
      await catatanModel.updateCatatanStatus(catatanId)
      catatan.status = 'Dibaca'
    }

    const formattedReplies = replies.map((reply) => ({
      id: reply.id,
      pengirim: {
        id: reply.pengirim_id,
        nama: reply.pengirim_nama,
        role: reply.pengirim_role === 'guru' ? 'Guru' : 'Orangtua',
      },
      pesan: reply.pesan,
      tanggal: reply.tanggal,
      timestamp: reply.timestamp,
    }))

    return {
      id: catatan.id,
      tanggal: catatan.tanggal,
      timestamp: catatan.timestamp,
      guru: {
        id: catatan.guru_id,
        nama: catatan.guru_nama,
      },
      kelas: {
        id: catatan.kelas_id,
        nama: catatan.nama_kelas,
      },
      mata_pelajaran: catatan.mapel_id
        ? {
          id: catatan.mapel_id,
          nama: catatan.nama_mapel,
        }
        : null,
      kategori: catatan.kategori,
      jenis: catatan.jenis,
      status: catatan.status,
      total_pesan: formattedReplies.length,
      diskusi: formattedReplies,
    }
  } catch (error) {
    console.error('Error in getCatatanDetailService:', error)
    throw error
  }
}

export const addCatatanReplyService = async (catatanId, siswaId, userId, replyData) => {
  try {
    const { pesan } = replyData

    if (!pesan || typeof pesan !== 'string') {
      throw new Error('Pesan harus diisi')
    }

    const trimmedPesan = pesan.trim()
    if (trimmedPesan.length === 0) {
      throw new Error('Pesan tidak boleh kosong')
    }

    if (trimmedPesan.length > 5000) {
      throw new Error('Pesan terlalu panjang. Maksimal 5000 karakter')
    }

    const catatan = await catatanModel.verifyCatatanExists(catatanId)
    if (!catatan) {
      throw new Error('Catatan tidak ditemukan')
    }
    if (catatan.siswa_id !== siswaId) {
      throw new Error('Anda tidak memiliki akses ke catatan ini')
    }

    const result = await catatanModel.addCatatanReply(catatanId, userId, trimmedPesan)

    const updatedCatatan = await catatanModel.getCatatanDetail(catatanId)
    const updatedReplies = await catatanModel.getCatatanReplies(catatanId)
    const formattedReplies = updatedReplies.map((reply) => ({
      id: reply.id,
      pengirim: {
        id: reply.pengirim_id,
        nama: reply.pengirim_nama,
        role: reply.pengirim_role === 'guru' ? 'Guru' : 'Orangtua',
      },
      pesan: reply.pesan,
      tanggal: reply.tanggal,
      timestamp: reply.timestamp,
    }))

    return {
      reply_id: result.reply_id,
      message: 'Balasan berhasil ditambahkan',
      catatan: {
        id: updatedCatatan.id,
        status: updatedCatatan.status,
        total_pesan: formattedReplies.length,
        diskusi: formattedReplies,
      },
    }
  } catch (error) {
    console.error('Error in addCatatanReplyService:', error)
    throw error
  }
}

export default {
  getStatistikService,
  getCatatanListService,
  getCatatanDetailService,
  addCatatanReplyService,
}
