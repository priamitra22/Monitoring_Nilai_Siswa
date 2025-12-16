import db from '../../config/db.js';

export const getConversationsByGuru = (guruId, filters) => {
  return new Promise((resolve, reject) => {
    const { search = '' } = filters;

    let query = `
      SELECT 
        cc.id,
        cc.ortu_id,
        o.nama_lengkap AS ortu_nama,
        cc.siswa_id,
        s.nama_lengkap AS siswa_nama,
        k.nama_kelas AS kelas_nama,
        cc.last_message,
        cc.last_message_time,
        cc.unread_count_guru AS unread_count,
        FALSE AS is_online
      FROM chat_conversations cc
      JOIN orangtua o ON cc.ortu_id = o.id
      JOIN siswa s ON cc.siswa_id = s.id
      LEFT JOIN kelas_siswa ks ON (
        ks.siswa_id = cc.siswa_id 
        AND ks.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
      )
      LEFT JOIN kelas k ON ks.kelas_id = k.id
      WHERE cc.guru_id = ?
        AND cc.is_archived_guru = FALSE
    `;

    const params = [guruId];

    if (search && search.trim() !== '') {
      query += ` AND (o.nama_lengkap LIKE ? OR s.nama_lengkap LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += `
      ORDER BY 
        cc.unread_count_guru DESC,
        cc.last_message_time DESC
    `;

    db.query(query, params, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

export const getTotalUnreadByGuru = (guruId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COALESCE(SUM(unread_count_guru), 0) AS total_unread
      FROM chat_conversations
      WHERE guru_id = ?
        AND is_archived_guru = FALSE
    `;

    db.query(query, [guruId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0]?.total_unread || 0);
    });
  });
};

export const getConversationById = (conversationId, guruId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        cc.*,
        o.nama_lengkap AS ortu_nama,
        s.nama_lengkap AS siswa_nama,
        k.nama_kelas AS kelas_nama
      FROM chat_conversations cc
      JOIN orangtua o ON cc.ortu_id = o.id
      JOIN siswa s ON cc.siswa_id = s.id
      LEFT JOIN kelas_siswa ks ON (
        ks.siswa_id = cc.siswa_id 
        AND ks.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
      )
      LEFT JOIN kelas k ON ks.kelas_id = k.id
      WHERE cc.id = ? AND cc.guru_id = ?
    `;

    db.query(query, [conversationId, guruId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0] || null);
    });
  });
};

export const getMessagesByConversation = (conversationId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        cm.id,
        cm.conversation_id,
        cm.sender_id,
        cm.sender_role,
        u.nama_lengkap AS sender_nama,
        cm.message,
        cm.is_read,
        cm.read_at,
        cm.created_at
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.conversation_id = ?
      ORDER BY cm.created_at ASC
    `;

    db.query(query, [conversationId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

export const markMessagesAsRead = (conversationId) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE chat_messages
      SET is_read = TRUE,
          read_at = NOW()
      WHERE conversation_id = ?
        AND sender_role = 'ortu'
        AND is_read = FALSE
    `;

    db.query(query, [conversationId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

export const resetUnreadCountGuru = (conversationId) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE chat_conversations
      SET unread_count_guru = 0
      WHERE id = ?
    `;

    db.query(query, [conversationId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

export const getLastMessageFromGuru = (conversationId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT created_at
      FROM chat_messages
      WHERE conversation_id = ?
        AND sender_role = 'guru'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    db.query(query, [conversationId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0] || null);
    });
  });
};

export const insertMessage = (data) => {
  return new Promise((resolve, reject) => {
    const { conversation_id, sender_id, sender_role, message } = data;

    const query = `
      INSERT INTO chat_messages (
        conversation_id, sender_id, sender_role, message, created_at
      ) VALUES (?, ?, ?, ?, NOW())
    `;

    db.query(query, [conversation_id, sender_id, sender_role, message], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve({
        insertId: results.insertId,
        affectedRows: results.affectedRows
      });
    });
  });
};

export const getMessageById = (messageId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        cm.id,
        cm.conversation_id,
        cm.sender_id,
        cm.sender_role,
        u.nama_lengkap AS sender_nama,
        cm.message,
        cm.is_read,
        cm.read_at,
        cm.created_at
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.id = ?
    `;

    db.query(query, [messageId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0] || null);
    });
  });
};

export const updateConversationAfterSend = (conversationId, message) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE chat_conversations
      SET last_message = ?,
          last_message_time = NOW(),
          unread_count_ortu = unread_count_ortu + 1
      WHERE id = ?
    `;

    db.query(query, [message, conversationId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

export const getSiswaForNewChat = (guruId, filters) => {
  return new Promise((resolve, reject) => {
    const { search = '', filter = '' } = filters;

    let query = `
      SELECT DISTINCT
        s.id AS siswa_id,
        s.nama_lengkap,
        s.nisn,
        k.id AS kelas_id,
        k.nama_kelas AS kelas,
        os.orangtua_id AS ortu_id,
        o.nama_lengkap AS ortu_nama,
        cc.id AS existing_conversation_id,
        CASE WHEN cc.id IS NOT NULL THEN TRUE ELSE FALSE END AS has_conversation
      FROM siswa s
      JOIN kelas_siswa ks ON s.id = ks.siswa_id
      JOIN kelas k ON ks.kelas_id = k.id
      LEFT JOIN orangtua_siswa os ON s.id = os.siswa_id
      LEFT JOIN orangtua o ON os.orangtua_id = o.id
      LEFT JOIN chat_conversations cc ON (
        cc.guru_id = ? AND 
        cc.siswa_id = s.id AND 
        cc.ortu_id = os.orangtua_id
      )
      WHERE ks.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
        AND (
          k.wali_kelas_id = ? OR
          EXISTS (
            SELECT 1 FROM kelas_mapel km
            WHERE km.kelas_id = k.id
              AND km.guru_id = ?
              AND km.tahun_ajaran_id = ks.tahun_ajaran_id
          )
        )
    `;

    const params = [guruId, guruId, guruId];

    if (filter === 'no_conversation') {
      query += ` AND cc.id IS NULL`;
    }
    if (search && search.trim() !== '') {
      query += ` AND s.nama_lengkap LIKE ?`;
      params.push(`%${search}%`);
    }

    query += `
      ORDER BY 
        has_conversation ASC,
        s.nama_lengkap ASC
    `;

    db.query(query, params, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

export const checkGuruMengampuSiswa = (guruId, siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT ks.siswa_id
      FROM kelas_siswa ks
      JOIN kelas k ON ks.kelas_id = k.id
      WHERE ks.siswa_id = ?
        AND ks.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
        AND (
          k.wali_kelas_id = ? OR
          EXISTS (
            SELECT 1 FROM kelas_mapel km
            WHERE km.kelas_id = ks.kelas_id
              AND km.guru_id = ?
              AND km.tahun_ajaran_id = ks.tahun_ajaran_id
          )
        )
    `;

    db.query(query, [siswaId, guruId, guruId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results.length > 0);
    });
  });
};

export const getOrtuBySiswa = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT os.orangtua_id, o.nama_lengkap AS ortu_nama
      FROM orangtua_siswa os
      JOIN orangtua o ON os.orangtua_id = o.id
      WHERE os.siswa_id = ?
      LIMIT 1
    `;

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0] || null);
    });
  });
};

export const checkConversationExists = (guruId, ortuId, siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        cc.*,
        o.nama_lengkap AS ortu_nama,
        s.nama_lengkap AS siswa_nama
      FROM chat_conversations cc
      JOIN orangtua o ON cc.ortu_id = o.id
      JOIN siswa s ON cc.siswa_id = s.id
      WHERE cc.guru_id = ? 
        AND cc.ortu_id = ? 
        AND cc.siswa_id = ?
    `;

    db.query(query, [guruId, ortuId, siswaId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0] || null);
    });
  });
};

export const insertConversation = (data) => {
  return new Promise((resolve, reject) => {
    const { guru_id, ortu_id, siswa_id } = data;

    const query = `
      INSERT INTO chat_conversations (
        guru_id, 
        ortu_id, 
        siswa_id, 
        tahun_ajaran_id,
        semester,
        created_at, 
        updated_at
      ) 
      SELECT 
        ? AS guru_id,
        ? AS ortu_id,
        ? AS siswa_id,
        ta.id AS tahun_ajaran_id,
        ta.semester AS semester,
        NOW() AS created_at,
        NOW() AS updated_at
      FROM tahun_ajaran ta
      WHERE ta.status = 'aktif'
      LIMIT 1
    `;

    db.query(query, [guru_id, ortu_id, siswa_id], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve({
        insertId: results.insertId,
        affectedRows: results.affectedRows
      });
    });
  });
};

export const getSiswaById = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT s.id, s.nama_lengkap
      FROM siswa s
      WHERE s.id = ?
    `;

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0] || null);
    });
  });
};

export default {
  getConversationsByGuru,
  getTotalUnreadByGuru,
  getConversationById,
  getMessagesByConversation,
  markMessagesAsRead,
  resetUnreadCountGuru,
  getLastMessageFromGuru,
  insertMessage,
  getMessageById,
  updateConversationAfterSend,
  getSiswaForNewChat,
  checkGuruMengampuSiswa,
  getOrtuBySiswa,
  checkConversationExists,
  insertConversation,
  getSiswaById
};

