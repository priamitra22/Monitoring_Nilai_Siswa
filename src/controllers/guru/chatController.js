import chatService from '../../services/guru/chatService.js';
import { getIO } from '../../socket/index.js';

const getGuruId = async (req) => {
  if (!req.user || !req.user.guru_id) {
    throw new Error('Guru ID tidak ditemukan. Pastikan Anda login sebagai guru.');
  }
  return req.user.guru_id;
};


export const getConversations = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);
    const { search = '' } = req.query;

    const result = await chatService.getConversationsService(guruId, { search });

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error in getConversations:', error);
    next(error);
  }
};


export const getMessages = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Conversation ID tidak valid',
        data: null
      });
    }

    const result = await chatService.getMessagesService(guruId, parseInt(id));

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error in getMessages:', error);

    if (error.message === 'Percakapan tidak ditemukan atau Anda tidak memiliki akses') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);
    const userId = req.user.id;
    const { id } = req.params;
    const { message } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Conversation ID tidak valid',
        data: null
      });
    }

    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: 'Pesan tidak boleh kosong',
        data: null
      });
    }

    const io = getIO();

    const result = await chatService.sendMessageService(guruId, userId, parseInt(id), { message }, io);

    res.status(201).json({
      status: 'success',
      message: 'Pesan berhasil dikirim',
      data: result
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);

    if (error.message === 'Pesan tidak boleh kosong') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Pesan maksimal 1000 karakter') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message.startsWith('Terlalu cepat!')) {
      return res.status(429).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Percakapan tidak ditemukan atau Anda tidak memiliki akses') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};

export const getSiswaForNewChat = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);
    const { search = '', filter = '' } = req.query;

    const result = await chatService.getSiswaForNewChatService(guruId, { search, filter });

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error in getSiswaForNewChat:', error);
    next(error);
  }
};


export const createConversation = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);
    const userId = req.user.id;
    const { siswa_id, initial_message } = req.body;

    const io = getIO();

    const result = await chatService.createConversationService(guruId, userId, {
      siswa_id,
      initial_message
    }, io);

    const statusCode = result.is_new ? 201 : 200;
    const message = result.is_new ? 'Percakapan berhasil dibuat' : 'Percakapan sudah ada';

    res.status(statusCode).json({
      status: 'success',
      message: message,
      data: result
    });
  } catch (error) {
    console.error('Error in createConversation:', error);

    if (error.message === 'siswa_id wajib diisi') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Siswa tidak ditemukan') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Siswa tidak memiliki orang tua terdaftar') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Anda tidak mengampu siswa ini') {
      return res.status(403).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Pesan awal maksimal 1000 karakter') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};

export default {
  getConversations,
  getMessages,
  sendMessage,
  getSiswaForNewChat,
  createConversation
};

