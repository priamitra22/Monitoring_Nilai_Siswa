import * as chatModel from '../../models/guru/chatModel.js';


export const getConversationsService = async (guruId, filters = {}) => {
  try {

    if (!guruId) {
      throw new Error('Guru ID tidak ditemukan');
    }

    const conversations = await chatModel.getConversationsByGuru(guruId, filters);

    const totalUnread = await chatModel.getTotalUnreadByGuru(guruId);

    return {
      conversations: conversations.map(conv => ({
        id: conv.id,
        ortu_id: conv.ortu_id,
        ortu_nama: conv.ortu_nama,
        siswa_id: conv.siswa_id,
        siswa_nama: conv.siswa_nama,
        kelas_nama: conv.kelas_nama || '-',
        last_message: conv.last_message || '',
        last_message_time: conv.last_message_time,
        unread_count: conv.unread_count,
        is_online: conv.is_online
      })),
      total_unread: totalUnread
    };
  } catch (error) {
    console.error('Error in getConversationsService:', error);
    throw error;
  }
};

export const getMessagesService = async (guruId, conversationId) => {
  try {
    if (!guruId) {
      throw new Error('Guru ID tidak ditemukan');
    }
    if (!conversationId) {
      throw new Error('Conversation ID tidak ditemukan');
    }

    const conversation = await chatModel.getConversationById(conversationId, guruId);
    if (!conversation) {
      throw new Error('Percakapan tidak ditemukan atau Anda tidak memiliki akses');
    }
    const messages = await chatModel.getMessagesByConversation(conversationId);

    await chatModel.markMessagesAsRead(conversationId);

    await chatModel.resetUnreadCountGuru(conversationId);

    return {
      conversation_info: {
        conversation_id: conversation.id,
        ortu_nama: conversation.ortu_nama,
        siswa_nama: conversation.siswa_nama,
        kelas_nama: conversation.kelas_nama || '-'
      },
      messages: messages.map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        sender_role: msg.sender_role,
        sender_nama: msg.sender_nama,
        message: msg.message,
        is_read: msg.sender_role === 'ortu' ? true : msg.is_read,
        read_at: msg.sender_role === 'ortu' && !msg.read_at ? new Date().toISOString() : msg.read_at,
        created_at: msg.created_at
      })),
      unread_count: 0
    };
  } catch (error) {
    console.error('Error in getMessagesService:', error);
    throw error;
  }
};

export const sendMessageService = async (guruId, userId, conversationId, messageData, io) => {
  try {
    const { message } = messageData;
    if (!message || message.trim() === '') {
      throw new Error('Pesan tidak boleh kosong');
    }

    if (message.length > 1000) {
      throw new Error('Pesan maksimal 1000 karakter');
    }
    const conversation = await chatModel.getConversationById(conversationId, guruId);
    if (!conversation) {
      throw new Error('Percakapan tidak ditemukan atau Anda tidak memiliki akses');
    }
    const insertResult = await chatModel.insertMessage({
      conversation_id: conversationId,
      sender_id: userId,
      sender_role: 'guru',
      message: message.trim()
    });

    await chatModel.updateConversationAfterSend(conversationId, message.trim());

    const newMessage = await chatModel.getMessageById(insertResult.insertId);

    if (io) {
      io.to(`conversation_${conversationId}`).emit('receive_message', {
        ...newMessage,
        is_read: newMessage.is_read
      });
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
      created_at: newMessage.created_at
    };

    return {
      id: newMessage.id,
      conversation_id: newMessage.conversation_id,
      sender_id: newMessage.sender_id,
      sender_role: newMessage.sender_role,
      sender_nama: newMessage.sender_nama,
      message: newMessage.message,
      is_read: newMessage.is_read,
      read_at: newMessage.read_at,
      created_at: newMessage.created_at
    };
  } catch (error) {
    console.error('Error in sendMessageService:', error);
    throw error;
  }
};

export const getSiswaForNewChatService = async (guruId, filters = {}) => {
  try {
    if (!guruId) {
      throw new Error('Guru ID tidak ditemukan');
    }

    const siswaList = await chatModel.getSiswaForNewChat(guruId, filters);

    return siswaList.map(siswa => ({
      siswa_id: siswa.siswa_id,
      nama_lengkap: siswa.nama_lengkap,
      nisn: siswa.nisn,
      kelas: siswa.kelas || '-',
      kelas_id: siswa.kelas_id,
      ortu_id: siswa.ortu_id,
      ortu_nama: siswa.ortu_nama || '-',
      has_conversation: siswa.has_conversation === 1 || siswa.has_conversation === true,
      existing_conversation_id: siswa.existing_conversation_id || null
    }));
  } catch (error) {
    console.error('Error in getSiswaForNewChatService:', error);
    throw error;
  }
};


export const createConversationService = async (guruId, userId, data, io) => {
  try {
    const { siswa_id, initial_message } = data;

    if (!siswa_id) {
      throw new Error('siswa_id wajib diisi');
    }

    const siswa = await chatModel.getSiswaById(siswa_id);
    if (!siswa) {
      throw new Error('Siswa tidak ditemukan');
    }

    const mengampu = await chatModel.checkGuruMengampuSiswa(guruId, siswa_id);
    if (!mengampu) {
      throw new Error('Anda tidak mengampu siswa ini');
    }

    const ortu = await chatModel.getOrtuBySiswa(siswa_id);
    if (!ortu) {
      throw new Error('Siswa tidak memiliki orang tua terdaftar');
    }

    const existingConversation = await chatModel.checkConversationExists(
      guruId,
      ortu.orangtua_id,
      siswa_id
    );

    if (existingConversation) {
      return {
        id: existingConversation.id,
        is_new: false,
        guru_id: existingConversation.guru_id,
        ortu_id: existingConversation.ortu_id,
        ortu_nama: existingConversation.ortu_nama,
        siswa_id: existingConversation.siswa_id,
        siswa_nama: existingConversation.siswa_nama,
        created_at: existingConversation.created_at
      };
    }

    const insertResult = await chatModel.insertConversation({
      guru_id: guruId,
      ortu_id: ortu.orangtua_id,
      siswa_id: siswa_id
    });

    const newConversationId = insertResult.insertId;

    if (initial_message && initial_message.trim() !== '') {
      if (initial_message.length > 1000) {
        throw new Error('Pesan awal maksimal 1000 karakter');
      }
      const msgInsertResult = await chatModel.insertMessage({
        conversation_id: newConversationId,
        sender_id: userId,
        sender_role: 'guru',
        message: initial_message.trim()
      });

      const fullMessage = await chatModel.getMessageById(msgInsertResult.insertId);

      if (io) {
        io.to(`conversation_${newConversationId}`).emit('receive_message', {
          ...fullMessage,
          is_read: fullMessage.is_read
        });
      }

      await chatModel.updateConversationAfterSend(newConversationId, initial_message.trim());
    }

    return {
      id: newConversationId,
      is_new: true,
      guru_id: guruId,
      ortu_id: ortu.orangtua_id,
      ortu_nama: ortu.ortu_nama,
      siswa_id: siswa_id,
      siswa_nama: siswa.nama_lengkap,
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in createConversationService:', error);
    throw error;
  }
};

export default {
  getConversationsService,
  getMessagesService,
  sendMessageService,
  getSiswaForNewChatService,
  createConversationService
};

