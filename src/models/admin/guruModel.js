import db from "../../config/db.js";

export const getAllDataGuru = (
  page = 1,
  limit = 10,
  search = "",
  status = "",
  sortBy = "nip",
  sortOrder = "asc"
) => {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;
    let query = `
        SELECT 
          id,
          user_id,
          nama_lengkap,
          nip,
          status,
          created_at
        FROM guru
      `;
    let countQuery = `
        SELECT COUNT(*) as total
        FROM guru
      `;
    const params = [];
    const countParams = [];
    let whereClauses = [];

    if (search) {
      const searchPattern = `%${search}%`;
      whereClauses.push("(nama_lengkap LIKE ? OR nip LIKE ?)");
      params.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }

    if (status) {
      whereClauses.push("status = ?");
      params.push(status);
      countParams.push(status);
    }

    if (whereClauses.length > 0) {
      const whereClause = " WHERE " + whereClauses.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }

    const allowedSortFields = ['id', 'nama_lengkap', 'nip', 'status', 'created_at'];
    const allowedSortOrders = ['asc', 'desc'];

    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = allowedSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    query += ` ORDER BY ${validSortBy} ${validSortOrder}, id ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.query(countQuery, countParams, (err, countResult) => {
      if (err) return reject(err);

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      db.query(query, params, (err, results) => {
        if (err) return reject(err);

        resolve({
          data: results,
          pagination: {
            current_page: page,
            total_pages: totalPages,
            total_data: total,
            per_page: limit,
            has_next: page < totalPages,
            has_prev: page > 1
          }
        });
      });
    });
  });
};

export const getGuruById = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
        SELECT 
          id,
          user_id,
          nama_lengkap,
          nip,
          status,
          created_at
        FROM guru
        WHERE id = ?
      `;
    db.query(query, [id], (err, results) => {
      if (err) return reject(err);

      if (results.length === 0) {
        return reject(new Error('Guru tidak ditemukan'));
      }

      resolve(results[0]);
    });
  });
};

export const getGuruStatistics = (search = "", status = "") => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        COUNT(*) as total_guru,
        SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as jumlah_aktif,
        SUM(CASE WHEN status = 'tidak-aktif' THEN 1 ELSE 0 END) as jumlah_tidak_aktif
      FROM guru
    `;
    const params = [];
    let whereClauses = [];

    if (search) {
      const searchPattern = `%${search}%`;
      whereClauses.push("(nama_lengkap LIKE ? OR nip LIKE ?)");
      params.push(searchPattern, searchPattern);
    }

    if (status) {
      whereClauses.push("status = ?");
      params.push(status);
    }

    if (whereClauses.length > 0) {
      const whereClause = " WHERE " + whereClauses.join(" AND ");
      query += whereClause;
    }

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

export const checkSingleGuru = (nip = null) => {
  return new Promise((resolve, reject) => {
    if (!nip) {
      return reject(new Error('NIP harus diisi'));
    }

    const query = `SELECT id, nama_lengkap, nip FROM guru WHERE nip = ?`;

    db.query(query, [nip], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
};

export const checkMultipleGuru = (nipList) => {
  return new Promise((resolve, reject) => {
    if (!nipList || !Array.isArray(nipList) || nipList.length === 0) {
      return reject(new Error('List NIP harus berupa array dan tidak boleh kosong'));
    }

    if (nipList.length > 50) {
      return reject(new Error('Maksimal 50 NIP per request'));
    }

    const placeholders = nipList.map(() => '?').join(',');
    const query = `SELECT nip FROM guru WHERE nip IN (${placeholders})`;

    db.query(query, nipList, (err, results) => {
      if (err) return reject(err);

      const existingNips = results.map(row => row.nip);
      resolve(existingNips);
    });
  });
};

export const bulkCreateGuru = (guruData) => {
  return new Promise((resolve, reject) => {
    if (!guruData || !Array.isArray(guruData) || guruData.length === 0) {
      return reject(new Error('Data guru harus berupa array dan tidak boleh kosong'));
    }

    if (guruData.length > 50) {
      return reject(new Error('Maksimal 50 guru per request'));
    }

    const validationErrors = [];
    const validData = [];

    guruData.forEach((guru, index) => {
      const errors = [];

      if (!guru.nama_lengkap || typeof guru.nama_lengkap !== 'string') {
        errors.push('Nama lengkap harus diisi');
      } else if (guru.nama_lengkap.trim().length < 2) {
        errors.push('Nama lengkap minimal 2 karakter');
      } else if (guru.nama_lengkap.trim().length > 100) {
        errors.push('Nama lengkap maksimal 100 karakter');
      }

      if (!guru.nip || typeof guru.nip !== 'string') {
        errors.push('NIP harus diisi');
      } else if (!/^\d{18}$/.test(guru.nip)) {
        errors.push('NIP harus 18 digit angka');
      }

      if (errors.length > 0) {
        validationErrors.push({
          index: index,
          nama_lengkap: guru.nama_lengkap || '',
          errors: errors
        });
      } else {
        validData.push({
          nama_lengkap: guru.nama_lengkap.trim(),
          nip: guru.nip,
          status: 'aktif'
        });
      }
    });

    if (validationErrors.length > 0) {
      return reject({
        type: 'validation',
        errors: validationErrors,
        valid_data: validData
      });
    }

    const nipCounts = {};
    const duplicateErrors = [];

    validData.forEach((guru, index) => {
      if (nipCounts[guru.nip]) {
        duplicateErrors.push({
          index: index,
          nama_lengkap: guru.nama_lengkap,
          field: 'NIP',
          value: guru.nip,
          error: 'NIP duplikat dalam batch'
        });
      } else {
        nipCounts[guru.nip] = true;
      }
    });

    if (duplicateErrors.length > 0) {
      return reject({
        type: 'duplicate',
        errors: duplicateErrors,
        valid_data: validData
      });
    }

    const nipList = validData.map(guru => guru.nip);
    const placeholders = nipList.map(() => '?').join(',');
    const checkQuery = `SELECT nip FROM guru WHERE nip IN (${placeholders})`;

    db.query(checkQuery, nipList, (err, existingResults) => {
      if (err) return reject(err);

      if (existingResults.length > 0) {
        const existingNips = existingResults.map(row => row.nip);
        const existingErrors = [];

        validData.forEach((guru, index) => {
          if (existingNips.includes(guru.nip)) {
            existingErrors.push({
              index: index,
              nama_lengkap: guru.nama_lengkap,
              field: 'NIP',
              value: guru.nip,
              error: 'NIP sudah digunakan'
            });
          }
        });

        return reject({
          type: 'existing',
          errors: existingErrors,
          valid_data: validData
        });
      }

      const insertQuery = `
        INSERT INTO guru (nama_lengkap, nip, status, created_at) 
        VALUES ${validData.map(() => '(?, ?, ?, NOW())').join(', ')}
      `;

      const insertParams = [];
      validData.forEach(guru => {
        insertParams.push(guru.nama_lengkap, guru.nip, guru.status);
      });

      db.query(insertQuery, insertParams, (err, insertResult) => {
        if (err) return reject(err);

        const insertedIds = [];
        for (let i = 0; i < validData.length; i++) {
          insertedIds.push(insertResult.insertId + i);
        }

        const placeholders = insertedIds.map(() => '?').join(',');
        const selectQuery = `
          SELECT id, nama_lengkap, nip, status, created_at 
          FROM guru 
          WHERE id IN (${placeholders})
          ORDER BY id ASC
        `;

        db.query(selectQuery, insertedIds, (err, results) => {
          if (err) return reject(err);

          resolve({
            inserted_count: results.length,
            inserted_data: results
          });
        });
      });
    });
  });
};

export const checkSingleGuruWithExclude = (nip = null, excludeId) => {
  return new Promise((resolve, reject) => {
    if (!nip) {
      return reject(new Error('NIP harus diisi'));
    }

    if (!excludeId || isNaN(excludeId)) {
      return reject(new Error('ID guru harus diisi dan berupa angka'));
    }

    const query = `SELECT id, nama_lengkap, nip FROM guru WHERE nip = ? AND id != ?`;

    db.query(query, [nip, excludeId], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
};

export const updateGuru = (guruId, guruData) => {
  return new Promise((resolve, reject) => {
    if (!guruId || isNaN(guruId)) {
      return reject(new Error('ID guru tidak valid'));
    }

    const errors = [];

    if (!guruData.nama_lengkap || typeof guruData.nama_lengkap !== 'string') {
      errors.push('Nama lengkap harus diisi');
    } else if (guruData.nama_lengkap.trim().length < 2) {
      errors.push('Nama lengkap minimal 2 karakter');
    } else if (guruData.nama_lengkap.trim().length > 100) {
      errors.push('Nama lengkap maksimal 100 karakter');
    }

    if (!guruData.nip || typeof guruData.nip !== 'string') {
      errors.push('NIP harus diisi');
    } else if (!/^\d{18}$/.test(guruData.nip)) {
      errors.push('NIP harus 18 digit angka');
    }

    if (errors.length > 0) {
      return reject({
        type: 'validation',
        errors: errors
      });
    }

    const checkQuery = `SELECT id FROM guru WHERE id = ?`;

    db.query(checkQuery, [guruId], (err, results) => {
      if (err) return reject(err);

      if (results.length === 0) {
        return reject(new Error('Guru tidak ditemukan'));
      }

      const nipCheckQuery = `SELECT id FROM guru WHERE nip = ? AND id != ?`;

      db.query(nipCheckQuery, [guruData.nip, guruId], (err, nipResults) => {
        if (err) return reject(err);

        if (nipResults.length > 0) {
          return reject(new Error('NIP sudah digunakan oleh guru lain'));
        }

        const updateQuery = `
          UPDATE guru 
          SET nama_lengkap = ?, nip = ?
          WHERE id = ?
        `;

        db.query(updateQuery, [
          guruData.nama_lengkap.trim(),
          guruData.nip,
          guruId
        ], (err, updateResult) => {
          if (err) return reject(err);

          const selectQuery = `
            SELECT id, nama_lengkap, nip, status, created_at
            FROM guru 
            WHERE id = ?
          `;

          db.query(selectQuery, [guruId], (err, results) => {
            if (err) return reject(err);

            resolve(results[0]);
          });
        });
      });
    });
  });
};

export const deleteGuru = (guruId) => {
  return new Promise((resolve, reject) => {
    if (!guruId || isNaN(guruId)) {
      return reject(new Error('ID guru tidak valid'));
    }

    const checkQuery = `SELECT id, nama_lengkap, nip FROM guru WHERE id = ?`;

    db.query(checkQuery, [guruId], (err, results) => {
      if (err) return reject(err);

      if (results.length === 0) {
        return reject(new Error('Guru tidak ditemukan'));
      }

      const guruData = results[0];

      const constraintQuery = `
        SELECT COUNT(*) as count 
        FROM kelas_mapel 
        WHERE guru_id = ?
      `;

      db.query(constraintQuery, [guruId], (err, constraintResults) => {
        if (err) return reject(err);

        if (constraintResults[0].count > 0) {
          return reject(new Error('Guru tidak dapat dihapus karena masih terhubung dengan mata pelajaran kelas'));
        }

        const deleteQuery = `DELETE FROM guru WHERE id = ?`;

        db.query(deleteQuery, [guruId], (err, deleteResult) => {
          if (err) return reject(err);

          resolve({
            id: guruData.id,
            nama_lengkap: guruData.nama_lengkap,
            nip: guruData.nip,
            deleted_at: new Date().toISOString()
          });
        });
      });
    });
  });
};