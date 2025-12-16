import chatService from '../../services/ortu/chatService.js'

export const getConversations = async (req, res, next) => {
  try {
    const siswaId = req.user.siswa_id
    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan dalam token',
      })
    }
    const { search, tahun, semester } = req.query
    const data = await chatService.getConversationsService(siswaId, {
      search,
      tahun: tahun || null,
      semester: semester || null,
    })

    res.status(200).json({
      status: 'success',
      data,
    })
  } catch (error) {
    console.error('Error in getConversations:', error)
    next(error)
  }
}

export const getTahunAjaranList = async (req, res, next) => {
  try {
    const siswaId = req.user.siswa_id
    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan dalam token',
      })
    }
    const data = await chatService.getTahunAjaranListService(siswaId)
    res.status(200).json({
      status: 'success',
      data,
    })
  } catch (error) {
    console.error('Error in getTahunAjaranList:', error)
    next(error)
  }
}

export const getSemesterList = async (req, res, next) => {
  try {
    const siswaId = req.user.siswa_id
    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan dalam token',
      })
    }
    const { tahun } = req.query
    if (!tahun) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter tahun wajib diisi',
      })
    }
    const data = await chatService.getSemesterListService(siswaId, tahun)
    res.status(200).json({
      status: 'success',
      data,
    })
  } catch (error) {
    console.error('Error in getSemesterList:', error)
    next(error)
  }
}


export const getMessages = async (req, res, next) => {
  try {
    const siswaId = req.user.siswa_id
    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan dalam token',
      })
    }
    const { id } = req.params
    const data = await chatService.getMessagesService(siswaId, id)
    res.status(200).json({
      status: 'success',
      data,
    })
  } catch (error) {
    if (
      error.message === 'Percakapan tidak ditemukan atau Anda tidak memiliki akses' ||
      error.message === 'Conversation ID tidak ditemukan'
    ) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      })
    }

    console.error('Error in getMessages:', error)
    next(error)
  }
}


export const sendMessage = async (req, res, next) => {
  try {
    const siswaId = req.user.siswa_id
    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan dalam token',
      })
    }
    const userId = req.user.id
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID tidak ditemukan dalam token',
      })
    }

    const { id } = req.params
    const { message } = req.body
    const io = req.app.get('io')
    const data = await chatService.sendMessageService(siswaId, userId, id, { message }, io)

    res.status(201).json({
      status: 'success',
      message: 'Pesan berhasil dikirim',
      data,
    })
  } catch (error) {
    if (error.message === 'Pesan tidak boleh kosong') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      })
    }

    if (error.message === 'Pesan maksimal 1000 karakter') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      })
    }

    if (error.message === 'Percakapan tidak ditemukan atau Anda tidak memiliki akses') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      })
    }

    if (error.message && error.message.includes('Terlalu cepat!')) {
      return res.status(429).json({
        status: 'error',
        message: error.message,
      })
    }

    if (
      error.message ===
      'Chat ini sudah tidak aktif. Anda hanya dapat mengirim pesan ke guru yang mengajar di tahun ajaran dan semester aktif.'
    ) {
      return res.status(403).json({
        status: 'error',
        message: error.message,
      })
    }

    console.error('Error in sendMessage controller:', error)
    next(error)
  }
}

export const getGuruList = async (req, res, next) => {
  try {
    const siswaId = req.user.siswa_id
    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan dalam token',
      })
    }

    const { search = '', filter = '' } = req.query

    const data = await chatService.getGuruForNewChatService(siswaId, {
      search,
      filter,
    })

    res.status(200).json({
      status: 'success',
      data: data,
    })
  } catch (error) {
    console.error('Error in getGuruList controller:', error)
    next(error)
  }
}

export const createConversation = async (req, res, next) => {
  try {
    const siswaId = req.user.siswa_id
    if (!siswaId) {
      return res.status(401).json({
        status: 'error',
        message: 'Siswa ID tidak ditemukan dalam token',
      })
    }

    const userId = req.user.id
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID tidak ditemukan dalam token',
      })
    }

    const { guru_id, initial_message } = req.body

    const io = req.app.get('io')

    const data = await chatService.createConversationService(siswaId, userId, {
      guru_id,
      initial_message,
    }, io)

    const statusCode = data.is_new ? 201 : 200

    res.status(statusCode).json({
      status: 'success',
      message: data.is_new ? 'Percakapan baru berhasil dibuat' : 'Percakapan sudah ada',
      data,
    })
  } catch (error) {
    if (error.message === 'guru_id wajib diisi') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      })
    }

    if (error.message === 'Guru tidak ditemukan') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      })
    }

    if (error.message === 'Guru ini tidak mengajar siswa Anda') {
      return res.status(403).json({
        status: 'error',
        message: error.message,
      })
    }

    if (error.message === 'Data orang tua tidak ditemukan') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      })
    }

    if (error.message === 'Pesan awal maksimal 1000 karakter') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      })
    }

    console.error('Error in createConversation controller:', error)
    next(error)
  }
}
