import db from "../../config/db.js";

export const getAllDataOrtu = (
  page = 1,
  limit = 10,
  search = "",
  relasi = "",
  sortBy = "nik",
  sortOrder = "asc"
) => {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        o.id,
        o.nama_lengkap,
        o.nik,
        o.kontak,
        o.relasi,
        o.created_at
      FROM orangtua o
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM orangtua o
    `;
    const params = [];
    const countParams = [];
    let whereClauses = [];

    if (search) {
      const searchPattern = `%${search}%`;
      whereClauses.push("(o.nama_lengkap LIKE ? OR o.nik LIKE ?)");
      params.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }

    if (relasi) {
      whereClauses.push("o.relasi = ?");
      params.push(relasi);
      countParams.push(relasi);
    }

    if (whereClauses.length > 0) {
      const whereClause = " WHERE " + whereClauses.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }

    const allowedSortFields = ['id', 'nama_lengkap', 'nik', 'kontak', 'relasi', 'created_at'];
    const allowedSortOrders = ['asc', 'desc'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'nik';
    const validSortOrder = allowedSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'ASC';
    query += ` ORDER BY o.${validSortBy} ${validSortOrder}, o.nama_lengkap ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.query(countQuery, countParams, (err, countResult) => {
      if (err) return reject(err);

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      db.query(query, params, (err, results) => {
        if (err) return reject(err);

        if (results.length > 0) {
          const ortuIds = results.map(ortu => ortu.id);
          const placeholders = ortuIds.map(() => '?').join(',');

          const anakQuery = `
            SELECT 
              os.orangtua_id,
              s.id,
              s.nama_lengkap,
              s.nisn
            FROM orangtua_siswa os
            JOIN siswa s ON os.siswa_id = s.id
            WHERE os.orangtua_id IN (${placeholders})
            ORDER BY os.orangtua_id, s.nama_lengkap
          `;

          db.query(anakQuery, ortuIds, (err, anakResults) => {
            if (err) return reject(err);

            const anakByOrtuId = {};
            anakResults.forEach(anak => {
              if (!anakByOrtuId[anak.orangtua_id]) {
                anakByOrtuId[anak.orangtua_id] = [];
              }
              anakByOrtuId[anak.orangtua_id].push({
                id: anak.id,
                nama_lengkap: anak.nama_lengkap,
                nisn: anak.nisn
              });
            });

            const ortuWithAnak = results.map(ortu => {
              const anak = anakByOrtuId[ortu.id] || [];
              return {
                ...ortu,
                anak: anak,
                jumlah_anak: anak.length
              };
            });

            resolve({
              data: ortuWithAnak,
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
        } else {
          resolve({
            data: [],
            pagination: {
              current_page: page,
              total_pages: 0,
              total_data: 0,
              per_page: limit,
              has_next: false,
              has_prev: false
            }
          });
        }
      });
    });
  });
};

export const getOrtuById = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        o.id,
        o.nama_lengkap,
        o.nik,
        o.kontak,
        o.relasi,
        o.created_at
      FROM orangtua o
      WHERE o.id = ?
    `;

    db.query(query, [id], (err, results) => {
      if (err) return reject(err);

      if (results.length === 0) {
        return reject(new Error('Orangtua tidak ditemukan'));
      }

      const ortu = results[0];

      const anakQuery = `
        SELECT 
          s.id,
          s.nama_lengkap,
          s.nisn
        FROM orangtua_siswa os
        JOIN siswa s ON os.siswa_id = s.id
        WHERE os.orangtua_id = ?
        ORDER BY s.nama_lengkap
      `;

      db.query(anakQuery, [ortu.id], (err, anakResults) => {
        if (err) return reject(err);

        resolve({
          ...ortu,
          anak: anakResults,
          jumlah_anak: anakResults.length
        });
      });
    });
  });
};

export const getOrtuByIdWithAnak = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        o.id,
        o.nama_lengkap,
        o.nik,
        o.kontak,
        o.relasi,
        o.created_at
      FROM orangtua o
      WHERE o.id = ?
    `;

    db.query(query, [id], (err, results) => {
      if (err) return reject(err);

      if (results.length === 0) {
        return reject(new Error('Orangtua tidak ditemukan'));
      }

      const ortu = results[0];

      const anakQuery = `
        SELECT 
          s.id,
          s.nama_lengkap,
          s.nisn,
          COALESCE(
            (SELECT k2.nama_kelas 
             FROM kelas_siswa ks2 
             JOIN kelas k2 ON ks2.kelas_id = k2.id 
             WHERE ks2.siswa_id = s.id 
             ORDER BY ks2.id DESC 
             LIMIT 1), 
            'Belum ada kelas'
          ) as kelas,
          COALESCE(
            (SELECT ta2.tahun 
             FROM kelas_siswa ks2 
             JOIN tahun_ajaran ta2 ON ks2.tahun_ajaran_id = ta2.id 
             WHERE ks2.siswa_id = s.id 
             ORDER BY ks2.id DESC 
             LIMIT 1), 
            'Belum ada tahun ajaran'
          ) as tahun_ajaran
        FROM orangtua_siswa os
        JOIN siswa s ON os.siswa_id = s.id
        WHERE os.orangtua_id = ?
        ORDER BY s.nama_lengkap
      `;

      db.query(anakQuery, [ortu.id], (err, anakResults) => {
        if (err) return reject(err);

        resolve({
          ...ortu,
          anak: anakResults,
          jumlah_anak: anakResults.length
        });
      });
    });
  });
};

export const getOrtuStatistics = (search = "", relasi = "") => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        COUNT(*) as total_ortu,
        SUM(CASE WHEN relasi = 'Ayah' THEN 1 ELSE 0 END) as jumlah_ayah,
        SUM(CASE WHEN relasi = 'Ibu' THEN 1 ELSE 0 END) as jumlah_ibu,
        SUM(CASE WHEN relasi = 'Wali' THEN 1 ELSE 0 END) as jumlah_wali
      FROM orangtua o
    `;
    const params = [];
    let whereClauses = [];

    if (search) {
      const searchPattern = `%${search}%`;
      whereClauses.push("(o.nama_lengkap LIKE ? OR o.nik LIKE ?)");
      params.push(searchPattern, searchPattern);
    }

    if (relasi) {
      whereClauses.push("o.relasi = ?");
      params.push(relasi);
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

export const getAvailableStudents = (search = "", limit = 50, excludeIds = []) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        s.id,
        s.nama_lengkap,
        s.nisn,
        COALESCE(
          (SELECT k2.nama_kelas 
           FROM kelas_siswa ks2 
           JOIN kelas k2 ON ks2.kelas_id = k2.id 
           WHERE ks2.siswa_id = s.id 
           ORDER BY ks2.id DESC 
           LIMIT 1), 
          'Belum ada kelas'
        ) as kelas,
        COALESCE(
          (SELECT ta2.tahun 
           FROM kelas_siswa ks2 
           JOIN tahun_ajaran ta2 ON ks2.tahun_ajaran_id = ta2.id 
           WHERE ks2.siswa_id = s.id 
           ORDER BY ks2.id DESC 
           LIMIT 1), 
          'Belum ada tahun ajaran'
        ) as tahun_ajaran
      FROM siswa s
      LEFT JOIN orangtua_siswa os ON s.id = os.siswa_id
      WHERE os.siswa_id IS NULL
    `;

    let countQuery = `
      SELECT COUNT(DISTINCT s.id) as total
      FROM siswa s
      LEFT JOIN orangtua_siswa os ON s.id = os.siswa_id
      WHERE os.siswa_id IS NULL
    `;

    const params = [];
    const countParams = [];
    let whereClauses = [];

    if (search) {
      const searchPattern = `%${search}%`;
      whereClauses.push("(s.nama_lengkap LIKE ? OR s.nisn LIKE ?)");
      params.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }

    if (excludeIds && excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(',');
      whereClauses.push(`s.id NOT IN (${placeholders})`);
      params.push(...excludeIds);
      countParams.push(...excludeIds);
    }

    if (whereClauses.length > 0) {
      const whereClause = " AND " + whereClauses.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY s.nama_lengkap ASC LIMIT ?`;
    params.push(limit);

    db.query(countQuery, countParams, (err, countResult) => {
      if (err) return reject(err);

      const total = countResult[0].total;

      db.query(query, params, (err, results) => {
        if (err) return reject(err);

        resolve({
          students: results,
          total_available: total
        });
      });
    });
  });
};

export const getAvailableStudentsForEdit = (search = "", limit = 50, excludeIds = [], includeIds = []) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        s.id,
        s.nama_lengkap,
        s.nisn,
        COALESCE(
          (SELECT k2.nama_kelas 
           FROM kelas_siswa ks2 
           JOIN kelas k2 ON ks2.kelas_id = k2.id 
           WHERE ks2.siswa_id = s.id 
           ORDER BY ks2.id DESC 
           LIMIT 1), 
          'Belum ada kelas'
        ) as kelas,
        COALESCE(
          (SELECT ta2.tahun 
           FROM kelas_siswa ks2 
           JOIN tahun_ajaran ta2 ON ks2.tahun_ajaran_id = ta2.id 
           WHERE ks2.siswa_id = s.id 
           ORDER BY ks2.id DESC 
           LIMIT 1), 
          'Belum ada tahun ajaran'
        ) as tahun_ajaran,
        CASE 
          WHEN os.siswa_id IS NOT NULL THEN 1 
          ELSE 0 
        END as is_related_to_current_parent
      FROM siswa s
      LEFT JOIN orangtua_siswa os ON s.id = os.siswa_id
      WHERE (
        os.siswa_id IS NULL 
        OR (os.siswa_id IS NOT NULL AND s.id IN (${includeIds.length > 0 ? includeIds.map(() => '?').join(',') : 'NULL'}))
      )
    `;

    let countQuery = `
      SELECT COUNT(DISTINCT s.id) as total
      FROM siswa s
      LEFT JOIN orangtua_siswa os ON s.id = os.siswa_id
      WHERE (
        os.siswa_id IS NULL 
        OR (os.siswa_id IS NOT NULL AND s.id IN (${includeIds.length > 0 ? includeIds.map(() => '?').join(',') : 'NULL'}))
      )
    `;

    const params = [];
    const countParams = [];
    let whereClauses = [];

    if (includeIds && includeIds.length > 0) {
      params.push(...includeIds);
      countParams.push(...includeIds);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      whereClauses.push("(s.nama_lengkap LIKE ? OR s.nisn LIKE ?)");
      params.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }

    if (excludeIds && excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(',');
      whereClauses.push(`s.id NOT IN (${placeholders})`);
      params.push(...excludeIds);
      countParams.push(...excludeIds);
    }

    if (whereClauses.length > 0) {
      const whereClause = " AND " + whereClauses.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY s.nama_lengkap ASC LIMIT ?`;
    params.push(limit);

    db.query(countQuery, countParams, (err, countResult) => {
      if (err) return reject(err);

      const total = countResult[0].total;

      db.query(query, params, (err, results) => {
        if (err) return reject(err);

        resolve({
          students: results,
          total_available: total
        });
      });
    });
  });
};

export const checkSingleOrtuNik = (nik = null) => {
  return new Promise((resolve, reject) => {
    if (!nik) {
      return reject(new Error('NIK harus diisi'));
    }
    const query = `SELECT id, nama_lengkap, nik FROM orangtua WHERE nik = ?`;
    db.query(query, [nik], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
};

export const checkSingleOrtuNikWithExclude = (nik = null, excludeId = null) => {
  return new Promise((resolve, reject) => {
    if (!nik) {
      return reject(new Error('NIK harus diisi'));
    }

    if (!excludeId) {
      return reject(new Error('Exclude ID harus diisi'));
    }

    const query = `SELECT id, nama_lengkap, nik FROM orangtua WHERE nik = ? AND id != ?`;

    db.query(query, [nik, excludeId], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
};

export const checkMultipleOrtuNik = (nikList) => {
  return new Promise((resolve, reject) => {
    if (!nikList || !Array.isArray(nikList) || nikList.length === 0) {
      return reject(new Error('List NIK harus berupa array dan tidak boleh kosong'));
    }
    if (nikList.length > 50) {
      return reject(new Error('Maksimal 50 NIK per request'));
    }
    const placeholders = nikList.map(() => '?').join(',');
    const query = `SELECT nik FROM orangtua WHERE nik IN (${placeholders})`;
    db.query(query, nikList, (err, results) => {
      if (err) return reject(err);
      const existingNiks = results.map(row => row.nik);
      resolve(existingNiks);
    });
  });
};

export const bulkCreateOrtu = (ortuData) => {
  return new Promise((resolve, reject) => {
    if (!ortuData || !Array.isArray(ortuData) || ortuData.length === 0) {
      return reject(new Error('Data orangtua harus berupa array dan tidak boleh kosong'));
    }

    if (ortuData.length > 50) {
      return reject(new Error('Maksimal 50 orangtua per request'));
    }

    const validationErrors = [];
    const validData = [];

    ortuData.forEach((ortu, index) => {
      const errors = [];

      if (!ortu.nama_lengkap || typeof ortu.nama_lengkap !== 'string') {
        errors.push('Nama lengkap harus diisi');
      } else if (ortu.nama_lengkap.trim().length < 2) {
        errors.push('Nama lengkap minimal 2 karakter');
      } else if (ortu.nama_lengkap.trim().length > 100) {
        errors.push('Nama lengkap maksimal 100 karakter');
      }

      if (!ortu.nik || typeof ortu.nik !== 'string') {
        errors.push('NIK harus diisi');
      } else if (!/^\d{16}$/.test(ortu.nik)) {
        errors.push('NIK harus 16 digit angka');
      }

      if (!ortu.kontak || typeof ortu.kontak !== 'string') {
        errors.push('Kontak harus diisi');
      } else if (ortu.kontak.trim().length < 10) {
        errors.push('Kontak minimal 10 karakter');
      } else if (ortu.kontak.trim().length > 20) {
        errors.push('Kontak maksimal 20 karakter');
      }

      if (!ortu.relasi || !['Ayah', 'Ibu', 'Wali'].includes(ortu.relasi)) {
        errors.push('Relasi harus dipilih (Ayah, Ibu, atau Wali)');
      }

      let validAnak = [];
      if (ortu.anak && Array.isArray(ortu.anak)) {
        ortu.anak.forEach((anak, anakIndex) => {
          if (!anak.id || typeof anak.id !== 'number') {
            errors.push(`Anak ${anakIndex + 1}: ID siswa harus diisi`);
          } else if (!anak.nama_lengkap || typeof anak.nama_lengkap !== 'string') {
            errors.push(`Anak ${anakIndex + 1}: Nama lengkap harus diisi`);
          } else if (!anak.nisn || typeof anak.nisn !== 'string') {
            errors.push(`Anak ${anakIndex + 1}: NISN harus diisi`);
          } else {
            validAnak.push({
              id: anak.id,
              nama_lengkap: anak.nama_lengkap.trim(),
              nisn: anak.nisn
            });
          }
        });
      }

      if (errors.length > 0) {
        validationErrors.push({
          index: index,
          nama_lengkap: ortu.nama_lengkap || '',
          errors: errors
        });
      } else {
        validData.push({
          nama_lengkap: ortu.nama_lengkap.trim(),
          nik: ortu.nik,
          kontak: ortu.kontak.trim(),
          relasi: ortu.relasi,
          anak: validAnak
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

    const nikList = validData.map(ortu => ortu.nik);
    const uniqueNiks = [...new Set(nikList)];

    if (nikList.length !== uniqueNiks.length) {
      const duplicateNiks = nikList.filter((nik, index) => nikList.indexOf(nik) !== index);
      return reject({
        type: 'duplicate',
        errors: [{
          field: 'NIK',
          values: duplicateNiks,
          error: 'NIK duplikat dalam batch'
        }],
        valid_data: validData
      });
    }

    const placeholders = nikList.map(() => '?').join(',');
    const checkQuery = `SELECT nik FROM orangtua WHERE nik IN (${placeholders})`;

    db.query(checkQuery, nikList, (err, existingNiks) => {
      if (err) return reject(err);

      if (existingNiks.length > 0) {
        const existingNikList = existingNiks.map(row => row.nik);
        return reject({
          type: 'existing',
          errors: [{
            field: 'NIK',
            values: existingNikList,
            error: 'NIK sudah digunakan'
          }],
          valid_data: validData
        });
      }

      const insertQuery = `
        INSERT INTO orangtua (nama_lengkap, nik, kontak, relasi, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;

      const insertPromises = validData.map((ortu, index) => {
        return new Promise((resolveInsert, rejectInsert) => {
          db.query(insertQuery, [ortu.nama_lengkap, ortu.nik, ortu.kontak, ortu.relasi], (err, result) => {
            if (err) return rejectInsert(err);

            const ortuId = result.insertId;
            const insertedOrtu = {
              id: ortuId,
              nama_lengkap: ortu.nama_lengkap,
              nik: ortu.nik,
              kontak: ortu.kontak,
              relasi: ortu.relasi,
              created_at: new Date(),
              anak: []
            };

            if (ortu.anak && ortu.anak.length > 0) {
              const anakPromises = ortu.anak.map(anak => {
                return new Promise((resolveAnak, rejectAnak) => {
                  const anakQuery = `
                    INSERT INTO orangtua_siswa (orangtua_id, siswa_id, created_at)
                    VALUES (?, ?, NOW())
                  `;
                  db.query(anakQuery, [ortuId, anak.id], (err, anakResult) => {
                    if (err) return rejectAnak(err);
                    resolveAnak(anak);
                  });
                });
              });

              Promise.all(anakPromises)
                .then(anakData => {
                  insertedOrtu.anak = anakData;
                  resolveInsert(insertedOrtu);
                })
                .catch(err => rejectInsert(err));
            } else {
              resolveInsert(insertedOrtu);
            }
          });
        });
      });

      Promise.all(insertPromises)
        .then(insertedData => {
          resolve({
            inserted_count: insertedData.length,
            inserted_data: insertedData
          });
        })
        .catch(err => reject(err));
    });
  });
};

export const updateOrtuWithAnak = (ortuId, ortuData, anakData) => {
  return new Promise((resolve, reject) => {
    db.beginTransaction((err) => {
      if (err) return reject(err);

      const updateOrtuQuery = `
        UPDATE orangtua 
        SET nama_lengkap = ?, nik = ?, kontak = ?, relasi = ?
        WHERE id = ?
      `;

      const ortuParams = [
        ortuData.nama_lengkap,
        ortuData.nik,
        ortuData.kontak,
        ortuData.relasi,
        ortuId
      ];

      db.query(updateOrtuQuery, ortuParams, (err, result) => {
        if (err) {
          return db.rollback(() => reject(err));
        }

        if (result.affectedRows === 0) {
          return db.rollback(() => reject(new Error('Orangtua tidak ditemukan')));
        }

        const deleteAnakQuery = `DELETE FROM orangtua_siswa WHERE orangtua_id = ?`;

        db.query(deleteAnakQuery, [ortuId], (err) => {
          if (err) {
            return db.rollback(() => reject(err));
          }

          if (anakData && anakData.length > 0) {
            const insertAnakQuery = `
              INSERT INTO orangtua_siswa (orangtua_id, siswa_id, created_at) 
              VALUES ${anakData.map(() => '(?, ?, NOW())').join(', ')}
            `;

            const anakParams = [];
            anakData.forEach(anak => {
              anakParams.push(ortuId, anak.id);
            });

            db.query(insertAnakQuery, anakParams, (err) => {
              if (err) {
                return db.rollback(() => reject(err));
              }

              db.commit((err) => {
                if (err) {
                  return db.rollback(() => reject(err));
                }
                getOrtuByIdWithAnak(ortuId)
                  .then(updatedOrtu => resolve(updatedOrtu))
                  .catch(reject);
              });
            });
          } else {
            db.commit((err) => {
              if (err) {
                return db.rollback(() => reject(err));
              }
              getOrtuByIdWithAnak(ortuId)
                .then(updatedOrtu => resolve(updatedOrtu))
                .catch(reject);
            });
          }
        });
      });
    });
  });
};

export const deleteOrtuWithAnak = (ortuId) => {
  return new Promise((resolve, reject) => {
    db.beginTransaction((err) => {
      if (err) return reject(err);
      const getOrtuQuery = `SELECT * FROM orangtua WHERE id = ?`;

      db.query(getOrtuQuery, [ortuId], (err, ortuResults) => {
        if (err) {
          return db.rollback(() => reject(err));
        }

        if (ortuResults.length === 0) {
          return db.rollback(() => reject(new Error('Orangtua tidak ditemukan')));
        }

        const ortuData = ortuResults[0];

        const getAnakQuery = `
          SELECT s.id, s.nama_lengkap, s.nisn
          FROM orangtua_siswa os
          JOIN siswa s ON os.siswa_id = s.id
          WHERE os.orangtua_id = ?
        `;

        db.query(getAnakQuery, [ortuId], (err, anakResults) => {
          if (err) {
            return db.rollback(() => reject(err));
          }

          const deleteAnakQuery = `DELETE FROM orangtua_siswa WHERE orangtua_id = ?`;

          db.query(deleteAnakQuery, [ortuId], (err) => {
            if (err) {
              return db.rollback(() => reject(err));
            }

            const deleteOrtuQuery = `DELETE FROM orangtua WHERE id = ?`;

            db.query(deleteOrtuQuery, [ortuId], (err, result) => {
              if (err) {
                return db.rollback(() => reject(err));
              }

              if (result.affectedRows === 0) {
                return db.rollback(() => reject(new Error('Orangtua tidak ditemukan')));
              }

              db.commit((err) => {
                if (err) {
                  return db.rollback(() => reject(err));
                }
                resolve({
                  ...ortuData,
                  anak: anakResults,
                  jumlah_anak: anakResults.length,
                  deleted_at: new Date()
                });
              });
            });
          });
        });
      });
    });
  });
};
