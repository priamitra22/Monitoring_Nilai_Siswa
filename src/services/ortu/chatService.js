import * as chatModel from '../../models/ortu/chatModel.js'

export const getConversationsService = async (siswaId, filters = {}) => {
  try {
    if (!siswaId) {
      throw new Error('Siswa ID tidak ditemukan')
    }

    const conversations = await chatModel.getConversationsBySiswa(siswaId, filters)

    const totalUnread = await chatModel.getTotalUnreadBySiswa(siswaId)

    return {
      conversations: conversations.map((conv) => ({
        id: conv.id,
        guru_id: conv.guru_id,
        guru_nama: conv.guru_nama,
        siswa_id: conv.siswa_id,
        siswa_nama: conv.siswa_nama,
        tahun_ajaran_id: conv.tahun_ajaran_id,
        tahun_ajaran: conv.tahun_ajaran,
        semester: conv.semester,
        kelas_nama: conv.kelas_nama || '-',
        last_message: conv.last_message || '',
        last_message_time: conv.last_message_time,
        unread_count: conv.unread_count,
        is_online: conv.is_online,
        is_guru_still_mengampu: conv.is_guru_still_mengampu,
      })),
      total_unread: totalUnread,
    }
  } catch (error) {
    console.error('Error in getConversationsService:', error)
    throw error
  }
}

export const getTahunAjaranListService = async (siswaId) => {
  try {
    if (!siswaId) {
      throw new Error('Siswa ID tidak ditemukan')
    }

    const tahunAjaranList = await chatModel.getTahunAjaranListBySiswa(siswaId)

    return tahunAjaranList.map((ta) => ({
      id: ta.id,
      tahun: ta.tahun,
      semester: ta.semester,
      status: ta.status,
      is_active: ta.is_active === 1 || ta.is_active === true,
    }))
  } catch (error) {
    console.error('Error in getTahunAjaranListService:', error)
    throw error
  }
}


export const getMessagesService = async (siswaId, conversationId) => {
  try {
    if (!siswaId) {
      throw new Error('Siswa ID tidak ditemukan')
    }
    if (!conversationId) {
      throw new Error('Conversation ID tidak ditemukan')
    }

    const conversation = await chatModel.getConversationBySiswaId(conversationId, siswaId)
    if (!conversation) {
      throw new Error('Percakapan tidak ditemukan atau Anda tidak memiliki akses')
    }

    const messages = await chatModel.getMessagesByConversation(conversationId)

    await chatModel.markMessagesAsReadOrtu(conversationId)

    await chatModel.resetUnreadCountOrtu(conversationId)
    return {
      conversation_info: {
        conversation_id: conversation.id,
        guru_nama: conversation.guru_nama,
        siswa_nama: conversation.siswa_nama,
        kelas_nama: conversation.kelas_nama || '-',
      },
      messages: messages.map((msg) => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        sender_role: msg.sender_role,
        sender_nama: msg.sender_nama,
        message: msg.message,
        is_read: msg.sender_role === 'guru' ? true : msg.is_read,
        read_at:
          msg.sender_role === 'guru' && !msg.read_at ? new Date().toISOString() : msg.read_at,
        created_at: msg.created_at,
      })),
      unread_count: 0,
    }
  } catch (error) {
    console.error('Error in getMessagesService:', error)
    throw error
  }
}

export const sendMessageService = async (siswaId, userId, conversationId, messageData, io) => {
  try {
    const { message } = messageData

    if (!message || message.trim() === '') {
      throw new Error('Pesan tidak boleh kosong')
    }

    if (message.length > 1000) {
      throw new Error('Pesan maksimal 1000 karakter')
    }
    const conversation = await chatModel.getConversationBySiswaId(conversationId, siswaId)
    if (!conversation) {
      throw new Error('Percakapan tidak ditemukan atau Anda tidak memiliki akses')
    }

    const insertResult = await chatModel.insertMessage({
      conversation_id: conversationId,
      sender_id: userId,
      sender_role: 'ortu',
      message: message.trim(),
    })

    await chatModel.updateConversationAfterSendOrtu(conversationId, message.trim())

    const newMessage = await chatModel.getMessageById(insertResult.insertId)

    if (io) {
      io.to(`conversation_${conversationId}`).emit('receive_message', {
        ...newMessage,
        is_read: newMessage.is_read,
      })
    }

    return {
      id: newMessage.id,
      conversation_id: newMessage.conversation_id,
      sender_id: newMessage.sender_id,
      sender_role: newMessage.sender_role,
      sender_nama: newMessage.sender_nama,
      message: newMessage.message,
      is_read: newMessage.is_read,
      read_at: newMessage.read_at,
      created_at: newMessage.created_at,
    }
  } catch (error) {
    console.error('Error in sendMessageService:', error)
    throw error
  }
}


export const getGuruForNewChatService = async (siswaId, filters = {}) => {
  try {
    if (!siswaId) {
      throw new Error('Siswa ID tidak ditemukan')
    }

    const guruList = await chatModel.getGuruForNewChat(siswaId, filters)

    return guruList.map((guru) => ({
      guru_id: guru.guru_id,
      guru_nama: guru.guru_nama,
      guru_username: guru.guru_username,
      kelas: guru.kelas || '-',
      kelas_id: guru.kelas_id,
      has_conversation: guru.has_conversation === 1 || guru.has_conversation === true,
      existing_conversation_id: guru.existing_conversation_id || null,
    }))
  } catch (error) {
    console.error('Error in getGuruForNewChatService:', error)
    throw error
  }
}

export const createConversationService = async (siswaId, userId, data, io) => {
  try {
    const { guru_id, initial_message } = data

    if (!guru_id) {
      throw new Error('guru_id wajib diisi')
    }
    const guru = await chatModel.getGuruById(guru_id)
    if (!guru) {
      throw new Error('Guru tidak ditemukan')
    }

    const mengajar = await chatModel.checkGuruMengajarSiswa(guru_id, siswaId)
    if (!mengajar) {
      throw new Error('Guru ini tidak mengajar siswa Anda')
    }

    const ortu = await chatModel.getOrtuBySiswa(siswaId)
    if (!ortu) {
      throw new Error('Data orang tua tidak ditemukan')
    }
    const existingConversation = await chatModel.checkConversationExistsOrtu(
      guru_id,
      ortu.orangtua_id,
      siswaId
    )

    if (existingConversation) {
      return {
        id: existingConversation.id,
        is_new: false,
        guru_id: existingConversation.guru_id,
        guru_nama: existingConversation.guru_nama,
        ortu_id: existingConversation.ortu_id,
        siswa_id: existingConversation.siswa_id,
        siswa_nama: existingConversation.siswa_nama,
        created_at: existingConversation.created_at,
      }
    }

    const insertResult = await chatModel.insertConversationOrtu({
      guru_id: guru_id,
      ortu_id: ortu.orangtua_id,
      siswa_id: siswaId,
    })

    const newConversationId = insertResult.insertId

    if (initial_message && initial_message.trim() !== '') {
      if (initial_message.length > 1000) {
        throw new Error('Pesan awal maksimal 1000 karakter')
      }



      const msgInsertResult = await chatModel.insertMessage({
        conversation_id: newConversationId,
        sender_id: userId,
        sender_role: 'ortu',
        message: initial_message.trim(),
      })

      const fullMessage = await chatModel.getMessageById(msgInsertResult.insertId)

      if (io) {
        io.to(`conversation_${newConversationId}`).emit('receive_message', {
          ...fullMessage,
          is_read: fullMessage.is_read,
        })
      }

      await chatModel.updateConversationAfterSendOrtu(newConversationId, initial_message.trim())
    }

    return {
      id: newConversationId,
      is_new: true,
      guru_id: guru_id,
      guru_nama: guru.guru_nama,
      ortu_id: ortu.orangtua_id,
      siswa_id: siswaId,
      siswa_nama: null,
      created_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error in createConversationService:', error)
    throw error
  }
}

export default {
  getConversationsService,
  getMessagesService,
  sendMessageService,
  getGuruForNewChatService,
  createConversationService,
  getTahunAjaranListService,
}
