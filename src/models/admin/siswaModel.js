import db from "../../config/db.js";

export const getAllDataSiswa = (
  page = 1,
  limit = 10,
  search = "",
  jenisKelamin = "",
  sortBy = "created_at",
  sortOrder = "desc"
) => {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        id,
        nama_lengkap,
        nisn,
        nik,
        jenis_kelamin,
        tanggal_lahir,
        tempat_lahir,
        created_at
      FROM siswa
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM siswa
    `;
    const params = [];
    const countParams = [];
    let whereClauses = [];

    if (search) {
      const searchPattern = `%${search}%`;
      whereClauses.push("(nama_lengkap LIKE ? OR nisn LIKE ? OR nik LIKE ?)");
      params.push(searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (jenisKelamin) {
      let mappedJenisKelamin = jenisKelamin;
      if (jenisKelamin === "L") {
        mappedJenisKelamin = "Laki-laki";
      } else if (jenisKelamin === "P") {
        mappedJenisKelamin = "Perempuan";
      }

      if (mappedJenisKelamin === "Laki-laki" || mappedJenisKelamin === "Perempuan") {
        whereClauses.push("jenis_kelamin = ?");
        params.push(mappedJenisKelamin);
        countParams.push(mappedJenisKelamin);
      }
    }

    if (whereClauses.length > 0) {
      const whereClause = " WHERE " + whereClauses.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }

    const allowedSortFields = ['id', 'nama_lengkap', 'nisn', 'nik', 'jenis_kelamin', 'tanggal_lahir', 'tempat_lahir', 'created_at'];
    const allowedSortOrders = ['asc', 'desc'];

    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = allowedSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    query += ` ORDER BY ${validSortBy} ${validSortOrder} LIMIT ? OFFSET ?`;
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

export const getDataSiswaById = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id,
        nama_lengkap,
        nisn,
        nik,
        jenis_kelamin,
        tanggal_lahir,
        tempat_lahir,
        created_at
      FROM siswa 
      WHERE id = ?
    `;

    db.query(query, [id], (err, results) => {
      if (err) return reject(err);

      if (results.length === 0) {
        return reject(new Error('Siswa tidak ditemukan'));
      }

      resolve(results[0]);
    });
  });
};

export const getSiswaStatistics = (search = "", jenisKelamin = "") => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        COUNT(*) as total_siswa,
        SUM(CASE WHEN jenis_kelamin = 'Laki-laki' THEN 1 ELSE 0 END) as jumlah_laki_laki,
        SUM(CASE WHEN jenis_kelamin = 'Perempuan' THEN 1 ELSE 0 END) as jumlah_perempuan
      FROM siswa
    `;
    const params = [];
    let whereClauses = [];

    if (search) {
      const searchPattern = `%${search}%`;
      whereClauses.push("(nama_lengkap LIKE ? OR nisn LIKE ? OR nik LIKE ?)");
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (jenisKelamin) {
      let mappedJenisKelamin = jenisKelamin;
      if (jenisKelamin === "L") {
        mappedJenisKelamin = "Laki-laki";
      } else if (jenisKelamin === "P") {
        mappedJenisKelamin = "Perempuan";
      }

      if (mappedJenisKelamin === "Laki-laki" || mappedJenisKelamin === "Perempuan") {
        whereClauses.push("jenis_kelamin = ?");
        params.push(mappedJenisKelamin);
      }
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

export const checkSingleSiswa = (nisn = null, nik = null) => {
  return new Promise((resolve, reject) => {
    if (!nisn && !nik) {
      return resolve({
        nisn_exists: false,
        nik_exists: false
      });
    }

    let query = 'SELECT nisn, nik FROM siswa WHERE ';
    const params = [];
    const conditions = [];

    if (nisn) {
      conditions.push('nisn = ?');
      params.push(nisn);
    }

    if (nik) {
      conditions.push('nik = ?');
      params.push(nik);
    }

    query += conditions.join(' OR ');

    db.query(query, params, (err, results) => {
      if (err) return reject(err);

      const nisnExists = nisn ? results.some(row => row.nisn === nisn) : false;
      const nikExists = nik ? results.some(row => row.nik === nik) : false;

      resolve({
        nisn_exists: nisnExists,
        nik_exists: nikExists
      });
    });
  });
};

export const checkSingleSiswaWithExclude = (nisn = null, nik = null, excludeId) => {
  return new Promise((resolve, reject) => {
    if (!excludeId || isNaN(excludeId)) {
      return reject(new Error('ID siswa tidak valid'));
    }

    if (!nisn && !nik) {
      return resolve({
        nisn_exists: false,
        nik_exists: false
      });
    }

    const checkStudentQuery = 'SELECT id FROM siswa WHERE id = ?';

    db.query(checkStudentQuery, [excludeId], (err, studentResults) => {
      if (err) return reject(err);

      if (studentResults.length === 0) {
        return reject(new Error('Siswa tidak ditemukan'));
      }

      let query = 'SELECT nisn, nik FROM siswa WHERE id != ? AND (';
      const params = [excludeId];
      const conditions = [];

      if (nisn) {
        conditions.push('nisn = ?');
        params.push(nisn);
      }

      if (nik) {
        conditions.push('nik = ?');
        params.push(nik);
      }

      query += conditions.join(' OR ') + ')';

      db.query(query, params, (err, results) => {
        if (err) return reject(err);

        const nisnExists = nisn ? results.some(row => row.nisn === nisn) : false;
        const nikExists = nik ? results.some(row => row.nik === nik) : false;

        resolve({
          nisn_exists: nisnExists,
          nik_exists: nikExists
        });
      });
    });
  });
};

export const checkMultipleSiswa = (nisnList, nikList) => {
  return new Promise((resolve, reject) => {
    if (!nisnList || !nikList || !Array.isArray(nisnList) || !Array.isArray(nikList)) {
      return resolve({
        existing_nisn: [],
        existing_nik: []
      });
    }

    if (nisnList.length === 0 && nikList.length === 0) {
      return resolve({
        existing_nisn: [],
        existing_nik: []
      });
    }

    const query = `
      SELECT nisn, nik FROM siswa 
      WHERE nisn IN (${nisnList.map(() => '?').join(',')}) 
      OR nik IN (${nikList.map(() => '?').join(',')})
    `;

    db.query(query, [...nisnList, ...nikList], (err, results) => {
      if (err) return reject(err);

      const existingNisn = results
        .filter(row => nisnList.includes(row.nisn))
        .map(row => row.nisn);

      const existingNik = results
        .filter(row => nikList.includes(row.nik))
        .map(row => row.nik);

      resolve({
        existing_nisn: existingNisn,
        existing_nik: existingNik
      });
    });
  });
};

export const bulkCreateSiswa = (siswaData) => {
  return new Promise((resolve, reject) => {
    if (!siswaData || !Array.isArray(siswaData) || siswaData.length === 0) {
      return reject(new Error('Data siswa tidak valid'));
    }

    const validationErrors = [];
    const validSiswaData = [];

    siswaData.forEach((siswa, index) => {
      const errors = [];

      if (!siswa.nama_lengkap || !siswa.nama_lengkap.trim()) {
        errors.push('Nama lengkap harus diisi');
      } else if (siswa.nama_lengkap.trim().length < 2) {
        errors.push('Nama lengkap minimal 2 karakter');
      } else if (siswa.nama_lengkap.trim().length > 100) {
        errors.push('Nama lengkap maksimal 100 karakter');
      }

      if (!siswa.nisn || !siswa.nisn.trim()) {
        errors.push('NISN harus diisi');
      }
      if (!siswa.nik || !siswa.nik.trim()) {
        errors.push('NIK harus diisi');
      }
      if (!siswa.jenis_kelamin) {
        errors.push('Jenis kelamin harus diisi');
      }
      if (!siswa.tempat_lahir || !siswa.tempat_lahir.trim()) {
        errors.push('Tempat lahir harus diisi');
      } else if (siswa.tempat_lahir.trim().length > 100) {
        errors.push('Tempat lahir maksimal 100 karakter');
      }
      if (!siswa.tanggal_lahir || !siswa.tanggal_lahir.trim()) {
        errors.push('Tanggal lahir harus diisi');
      }

      if (siswa.nisn && !/^\d{10}$/.test(siswa.nisn.trim())) {
        errors.push('NISN harus 10 digit angka');
      }
      if (siswa.nik && !/^\d{16}$/.test(siswa.nik.trim())) {
        errors.push('NIK harus 16 digit angka');
      }
      if (siswa.tanggal_lahir && !/^\d{2}\/\d{2}\/\d{4}$/.test(siswa.tanggal_lahir.trim())) {
        errors.push('Tanggal lahir harus format dd/mm/yyyy');
      }

      if (siswa.tanggal_lahir && /^\d{2}\/\d{2}\/\d{4}$/.test(siswa.tanggal_lahir.trim())) {
        const dateParts = siswa.tanggal_lahir.split('/');
        const inputDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(inputDate.getTime())) {
          errors.push('Tanggal lahir tidak valid');
        } else if (inputDate > today) {
          errors.push('Tanggal lahir tidak boleh di masa depan');
        }
      }

      if (siswa.jenis_kelamin && !['Laki-laki', 'Perempuan'].includes(siswa.jenis_kelamin)) {
        errors.push('Jenis kelamin harus Laki-laki atau Perempuan');
      }

      if (errors.length > 0) {
        validationErrors.push({
          index: index + 1,
          nama_lengkap: siswa.nama_lengkap || 'Tidak ada nama',
          errors: errors
        });
      } else {
        const dateParts = siswa.tanggal_lahir.split('/');
        const formattedDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;

        validSiswaData.push({
          nama_lengkap: siswa.nama_lengkap.trim(),
          nisn: siswa.nisn.trim(),
          nik: siswa.nik.trim(),
          jenis_kelamin: siswa.jenis_kelamin,
          tempat_lahir: siswa.tempat_lahir.trim(),
          tanggal_lahir: formattedDate
        });
      }
    });

    if (validationErrors.length > 0) {
      return resolve({
        success: false,
        error_type: 'validation',
        validation_errors: validationErrors,
        valid_data: []
      });
    }

    const nisnList = validSiswaData.map(s => s.nisn);
    const nikList = validSiswaData.map(s => s.nik);

    const duplicateErrors = [];

    validSiswaData.forEach((siswa, index) => {
      const nisnCount = nisnList.filter(n => n === siswa.nisn).length;
      const nikCount = nikList.filter(n => n === siswa.nik).length;

      if (nisnCount > 1) {
        duplicateErrors.push({
          index: index + 1,
          nama_lengkap: siswa.nama_lengkap,
          field: 'NISN',
          value: siswa.nisn,
          error: 'NISN duplikat dalam batch'
        });
      }

      if (nikCount > 1) {
        duplicateErrors.push({
          index: index + 1,
          nama_lengkap: siswa.nama_lengkap,
          field: 'NIK',
          value: siswa.nik,
          error: 'NIK duplikat dalam batch'
        });
      }
    });

    if (duplicateErrors.length > 0) {
      return resolve({
        success: false,
        error_type: 'duplicate',
        duplicate_errors: duplicateErrors,
        valid_data: []
      });
    }

    const checkQuery = `
      SELECT nisn, nik FROM siswa 
      WHERE nisn IN (${nisnList.map(() => '?').join(',')}) 
      OR nik IN (${nikList.map(() => '?').join(',')})
    `;

    db.query(checkQuery, [...nisnList, ...nikList], (err, results) => {
      if (err) return reject(err);

      if (results.length > 0) {
        const existingNisn = results.map(row => row.nisn);
        const existingNik = results.map(row => row.nik);

        const existingErrors = [];

        validSiswaData.forEach((siswa, index) => {
          if (existingNisn.includes(siswa.nisn)) {
            existingErrors.push({
              index: index + 1,
              nama_lengkap: siswa.nama_lengkap,
              field: 'NISN',
              value: siswa.nisn,
              error: 'NISN sudah digunakan'
            });
          }

          if (existingNik.includes(siswa.nik)) {
            existingErrors.push({
              index: index + 1,
              nama_lengkap: siswa.nama_lengkap,
              field: 'NIK',
              value: siswa.nik,
              error: 'NIK sudah digunakan'
            });
          }
        });

        return resolve({
          success: false,
          error_type: 'existing',
          existing_errors: existingErrors,
          valid_data: []
        });
      }

      const insertQuery = `
        INSERT INTO siswa (nama_lengkap, nisn, nik, jenis_kelamin, tempat_lahir, tanggal_lahir, created_at)
        VALUES ${validSiswaData.map(() => '(?, ?, ?, ?, ?, ?, NOW())').join(', ')}
      `;

      const insertParams = validSiswaData.flatMap(siswa => [
        siswa.nama_lengkap,
        siswa.nisn,
        siswa.nik,
        siswa.jenis_kelamin,
        siswa.tempat_lahir,
        siswa.tanggal_lahir
      ]);

      db.query(insertQuery, insertParams, (err, result) => {
        if (err) return reject(err);

        const insertedIds = [];
        for (let i = 0; i < result.affectedRows; i++) {
          insertedIds.push(result.insertId + i);
        }

        const getInsertedQuery = `
          SELECT * FROM siswa 
          WHERE id IN (${insertedIds.map(() => '?').join(',')})
          ORDER BY id ASC
        `;

        db.query(getInsertedQuery, insertedIds, (err, insertedResults) => {
          if (err) return reject(err);

          resolve({
            success: true,
            inserted_count: result.affectedRows,
            inserted_data: insertedResults
          });
        });
      });
    });
  });
};

export const updateSiswa = (siswaId, siswaData) => {
  return new Promise((resolve, reject) => {
    if (!siswaId || isNaN(siswaId)) {
      return reject(new Error('ID siswa tidak valid'));
    }

    if (!siswaData || typeof siswaData !== 'object') {
      return reject(new Error('Data siswa tidak valid'));
    }

    const errors = [];

    if (!siswaData.nama_lengkap || !siswaData.nama_lengkap.trim()) {
      errors.push('Nama lengkap harus diisi');
    } else if (siswaData.nama_lengkap.trim().length < 2) {
      errors.push('Nama lengkap minimal 2 karakter');
    } else if (siswaData.nama_lengkap.trim().length > 100) {
      errors.push('Nama lengkap maksimal 100 karakter');
    }

    if (!siswaData.nisn || !siswaData.nisn.trim()) {
      errors.push('NISN harus diisi');
    } else if (!/^\d{10}$/.test(siswaData.nisn.trim())) {
      errors.push('NISN harus 10 digit angka');
    }

    if (!siswaData.nik || !siswaData.nik.trim()) {
      errors.push('NIK harus diisi');
    } else if (!/^\d{16}$/.test(siswaData.nik.trim())) {
      errors.push('NIK harus 16 digit angka');
    }

    if (!siswaData.jenis_kelamin) {
      errors.push('Jenis kelamin harus diisi');
    } else if (!['Laki-laki', 'Perempuan'].includes(siswaData.jenis_kelamin)) {
      errors.push('Jenis kelamin harus Laki-laki atau Perempuan');
    }

    if (!siswaData.tempat_lahir || !siswaData.tempat_lahir.trim()) {
      errors.push('Tempat lahir harus diisi');
    } else if (siswaData.tempat_lahir.trim().length > 100) {
      errors.push('Tempat lahir maksimal 100 karakter');
    }

    if (!siswaData.tanggal_lahir || !siswaData.tanggal_lahir.trim()) {
      errors.push('Tanggal lahir harus diisi');
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(siswaData.tanggal_lahir.trim())) {
      errors.push('Tanggal lahir harus format dd/mm/yyyy');
    }

    if (siswaData.tanggal_lahir && /^\d{2}\/\d{2}\/\d{4}$/.test(siswaData.tanggal_lahir.trim())) {
      const dateParts = siswaData.tanggal_lahir.split('/');
      const inputDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(inputDate.getTime())) {
        errors.push('Tanggal lahir tidak valid');
      } else if (inputDate > today) {
        errors.push('Tanggal lahir tidak boleh di masa depan');
      }
    }

    if (errors.length > 0) {
      return reject(new Error(JSON.stringify({ validation_errors: errors })));
    }

    const checkStudentQuery = 'SELECT id FROM siswa WHERE id = ?';

    db.query(checkStudentQuery, [siswaId], (err, studentResults) => {
      if (err) return reject(err);

      if (studentResults.length === 0) {
        return reject(new Error('Siswa tidak ditemukan'));
      }

      const checkNisnQuery = 'SELECT id, nama_lengkap FROM siswa WHERE nisn = ? AND id != ?';

      db.query(checkNisnQuery, [siswaData.nisn.trim(), siswaId], (err, nisnResults) => {
        if (err) return reject(err);

        if (nisnResults.length > 0) {
          return reject(new Error('NISN sudah digunakan oleh siswa lain'));
        }

        const checkNikQuery = 'SELECT id, nama_lengkap FROM siswa WHERE nik = ? AND id != ?';

        db.query(checkNikQuery, [siswaData.nik.trim(), siswaId], (err, nikResults) => {
          if (err) return reject(err);

          if (nikResults.length > 0) {
            return reject(new Error('NIK sudah digunakan oleh siswa lain'));
          }

          const dateParts = siswaData.tanggal_lahir.split('/');
          const formattedDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;

          const updateQuery = `
            UPDATE siswa 
            SET nama_lengkap = ?, nisn = ?, nik = ?, jenis_kelamin = ?, 
                tempat_lahir = ?, tanggal_lahir = ?
            WHERE id = ?
          `;

          const updateParams = [
            siswaData.nama_lengkap.trim(),
            siswaData.nisn.trim(),
            siswaData.nik.trim(),
            siswaData.jenis_kelamin,
            siswaData.tempat_lahir.trim(),
            formattedDate,
            siswaId
          ];

          db.query(updateQuery, updateParams, (err, result) => {
            if (err) return reject(err);

            if (result.affectedRows === 0) {
              return reject(new Error('Gagal memperbarui data siswa'));
            }

            const getUpdatedQuery = 'SELECT * FROM siswa WHERE id = ?';
            db.query(getUpdatedQuery, [siswaId], (err, updatedResults) => {
              if (err) return reject(err);

              resolve({
                success: true,
                message: 'Data siswa berhasil diperbarui',
                data: updatedResults[0]
              });
            });
          });
        });
      });
    });
  });
};

export const deleteSiswa = (siswaId) => {
  return new Promise((resolve, reject) => {
    if (!siswaId || isNaN(siswaId)) {
      return reject(new Error('ID siswa tidak valid'));
    }

    const checkStudentQuery = 'SELECT * FROM siswa WHERE id = ?';

    db.query(checkStudentQuery, [siswaId], (err, studentResults) => {
      if (err) return reject(err);

      if (studentResults.length === 0) {
        return reject(new Error('Siswa tidak ditemukan'));
      }

      const studentData = studentResults[0];

      const deleteQuery = 'DELETE FROM siswa WHERE id = ?';

      db.query(deleteQuery, [siswaId], (err, result) => {
        if (err) {
          if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return reject(new Error('Tidak dapat menghapus siswa karena masih terhubung dengan data lain (kelas/nilai)'));
          }
          return reject(err);
        }

        if (result.affectedRows === 0) {
          return reject(new Error('Gagal menghapus data siswa'));
        }

        resolve({
          success: true,
          message: 'Data siswa berhasil dihapus',
          data: {
            id: studentData.id,
            nama_lengkap: studentData.nama_lengkap,
            nisn: studentData.nisn,
            nik: studentData.nik,
            jenis_kelamin: studentData.jenis_kelamin,
            deleted_at: new Date()
          }
        });
      });
    });
  });
};