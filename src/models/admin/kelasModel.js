import db from "../../config/db.js";

export const getTahunajaranKelasGuru = () => {
  return new Promise((resolve, reject) => {
    const tahunAjaranQuery = `
      SELECT 
        id,
        tahun,
        semester,
        status,
        CONCAT(tahun, ' - ', semester) as label_tahun_ajaran
      FROM tahun_ajaran
      ORDER BY tahun DESC, 
        CASE 
          WHEN semester = 'Ganjil' THEN 1 
          WHEN semester = 'Genap' THEN 2 
          ELSE 3 
        END
    `;

    const tahunAjaranAktifQuery = `
      SELECT 
        id,
        tahun,
        semester,
        status,
        CONCAT(tahun, ' - ', semester) as label_tahun_ajaran
      FROM tahun_ajaran
      WHERE status = 'aktif'
      ORDER BY id DESC
      LIMIT 1
    `;

    db.query(tahunAjaranQuery, (err1, tahunAjaranResults) => {
      if (err1) return reject(err1);

      db.query(tahunAjaranAktifQuery, (err2, tahunAjaranAktifResults) => {
        if (err2) return reject(err2);

        resolve({
          tahunAjaranList: tahunAjaranResults,
          tahunAjaranAktif: tahunAjaranAktifResults.length > 0 ? tahunAjaranAktifResults[0] : null
        });
      });
    });
  });
};

export const getDaftarKelas = (tahunAjaranId, page = 1, limit = 5) => {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;

    const kelasQuery = `
      SELECT 
        k.id,
        k.nama_kelas,
        g.id as wali_kelas_id,
        g.nama_lengkap as wali_kelas_nama,
        g.nip as wali_kelas_nip,
        ta.id as tahun_ajaran_id,
        ta.tahun,
        ta.semester,
        COUNT(DISTINCT ks.siswa_id) as jumlah_siswa,
        COUNT(DISTINCT km.mapel_id) as jumlah_mapel
      FROM kelas k
      LEFT JOIN guru g ON k.wali_kelas_id = g.id
      INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      LEFT JOIN kelas_siswa ks ON k.id = ks.kelas_id AND ks.tahun_ajaran_id = ta.id
      LEFT JOIN kelas_mapel km ON k.id = km.kelas_id AND km.tahun_ajaran_id = ta.id
      WHERE ta.id = ?
      GROUP BY k.id, k.nama_kelas, g.id, g.nama_lengkap, g.nip, ta.id, ta.tahun, ta.semester
      ORDER BY k.nama_kelas
      LIMIT ? OFFSET ?
    `;
    const countQuery = `
      SELECT COUNT(DISTINCT k.id) as total
      FROM kelas k
      INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      WHERE ta.id = ?
    `;

    db.query(kelasQuery, [tahunAjaranId, limit, offset], (err1, kelasResults) => {
      if (err1) return reject(err1);

      db.query(countQuery, [tahunAjaranId], (err2, countResults) => {
        if (err2) return reject(err2);

        const totalData = countResults[0].total;
        const totalPages = Math.ceil(totalData / limit);

        resolve({
          kelas: kelasResults,
          pagination: {
            current_page: page,
            total_pages: totalPages,
            total_data: totalData,
            per_page: limit,
            has_next: page < totalPages,
            has_prev: page > 1
          }
        });
      });
    });
  });
};

export const getDropdownKelas = (tahunAjaranId = null, excludeKelasId = null) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        k.id,
        k.nama_kelas,
        k.tahun_ajaran_id,
        ta.tahun,
        ta.semester,
        CONCAT(k.nama_kelas, ' (', ta.tahun, ' - ', ta.semester, ')') as label_kelas,
        COUNT(DISTINCT ks.siswa_id) as jumlah_siswa
      FROM kelas k
      INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      LEFT JOIN kelas_siswa ks ON k.id = ks.kelas_id AND ks.tahun_ajaran_id = ta.id
    `;

    const params = [];
    const conditions = [];

    if (tahunAjaranId) {
      conditions.push('ta.id = ?');
      params.push(tahunAjaranId);
    }

    if (excludeKelasId) {
      conditions.push('k.id != ?');
      params.push(excludeKelasId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY k.id, k.nama_kelas, k.tahun_ajaran_id, ta.tahun, ta.semester
      ORDER BY k.nama_kelas
    `;

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

export const getDropdownWaliKelas = (tahunAjaranId = null, excludeKelasId = null) => {
  return new Promise((resolve, reject) => {
    let query, params;

    if (tahunAjaranId) {
      if (excludeKelasId) {
        query = `
          SELECT 
            g.id,
            g.nama_lengkap,
            g.nip
          FROM guru g
          WHERE g.status = 'aktif'
          AND (
            g.id NOT IN (
              SELECT DISTINCT k.wali_kelas_id 
              FROM kelas k 
              WHERE k.tahun_ajaran_id = ? AND k.wali_kelas_id IS NOT NULL
            )
            OR g.id IN (
              SELECT k2.wali_kelas_id 
              FROM kelas k2 
              WHERE k2.id = ? AND k2.wali_kelas_id IS NOT NULL
            )
          )
          ORDER BY g.nama_lengkap ASC
        `;
        params = [tahunAjaranId, excludeKelasId];
      } else {
        query = `
          SELECT 
            g.id,
            g.nama_lengkap,
            g.nip
          FROM guru g
          WHERE g.status = 'aktif'
          AND g.id NOT IN (
            SELECT DISTINCT k.wali_kelas_id 
            FROM kelas k 
            WHERE k.tahun_ajaran_id = ? AND k.wali_kelas_id IS NOT NULL
          )
          ORDER BY g.nama_lengkap ASC
        `;
        params = [tahunAjaranId];
      }
    } else {
      query = `
        SELECT 
          id,
          nama_lengkap,
          nip
        FROM guru
        WHERE status = 'aktif'
        ORDER BY nama_lengkap ASC
      `;
      params = [];
    }

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

export const getCurrentSelection = (tahunAjaranId = null) => {
  return new Promise((resolve, reject) => {
    let query, params;

    if (tahunAjaranId) {
      query = `
        SELECT 
          id,
          tahun,
          semester,
          status,
          CONCAT(tahun, ' - ', semester) as label_tahun_ajaran
        FROM tahun_ajaran
        WHERE id = ?
      `;
      params = [tahunAjaranId];
    } else {
      query = `
        SELECT 
          id,
          tahun,
          semester,
          status,
          CONCAT(tahun, ' - ', semester) as label_tahun_ajaran
        FROM tahun_ajaran
        WHERE status = 'aktif'
        ORDER BY id DESC
        LIMIT 1
      `;
      params = [];
    }

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0 ? results[0] : null);
    });
  });
};

export const tambahKelas = (namaKelas, waliKelasId, tahunAjaranId) => {
  return new Promise((resolve, reject) => {
    const checkNamaKelasQuery = `
      SELECT id FROM kelas 
      WHERE nama_kelas = ? AND tahun_ajaran_id = ?
    `;

    const checkWaliKelasQuery = `
      SELECT id, nama_kelas FROM kelas 
      WHERE wali_kelas_id = ? AND tahun_ajaran_id = ?
    `;

    db.query(checkNamaKelasQuery, [namaKelas, tahunAjaranId], (err1, namaKelasResults) => {
      if (err1) return reject(err1);

      db.query(checkWaliKelasQuery, [waliKelasId, tahunAjaranId], (err2, waliKelasResults) => {
        if (err2) return reject(err2);

        if (namaKelasResults.length > 0) {
          return reject(new Error('Nama kelas sudah ada untuk tahun ajaran ini'));
        }

        if (waliKelasResults.length > 0) {
          const existingKelas = waliKelasResults[0];
          return reject(new Error(`Guru ini sudah menjadi wali kelas untuk kelas "${existingKelas.nama_kelas}" pada tahun ajaran ini`));
        }

        const insertQuery = `
          INSERT INTO kelas (nama_kelas, wali_kelas_id, tahun_ajaran_id)
          VALUES (?, ?, ?)
        `;

        db.query(insertQuery, [namaKelas, waliKelasId, tahunAjaranId], (err3, result) => {
          if (err3) return reject(err3);

          const getQuery = `
            SELECT 
              k.id,
              k.nama_kelas,
              g.id as wali_kelas_id,
              g.nama_lengkap as wali_kelas_nama,
              g.nip as wali_kelas_nip,
              ta.id as tahun_ajaran_id,
              ta.tahun,
              ta.semester
            FROM kelas k
            LEFT JOIN guru g ON k.wali_kelas_id = g.id
            INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
            WHERE k.id = ?
          `;

          db.query(getQuery, [result.insertId], (err4, kelasData) => {
            if (err4) return reject(err4);
            resolve(kelasData[0]);
          });
        });
      });
    });
  });
};

export const getDetailKelas = (kelasId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        k.id,
        k.nama_kelas,
        g.id as wali_kelas_id,
        g.nama_lengkap as wali_kelas_nama,
        g.nip as wali_kelas_nip,
        ta.id as tahun_ajaran_id,
        ta.tahun,
        ta.semester,
        ta.status as status_tahun_ajaran
      FROM kelas k
      LEFT JOIN guru g ON k.wali_kelas_id = g.id
      INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      WHERE k.id = ?
    `;

    db.query(query, [kelasId], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0 ? results[0] : null);
    });
  });
};

export const updateKelas = (kelasId, namaKelas, waliKelasId, tahunAjaranId) => {
  return new Promise((resolve, reject) => {
    const checkNamaKelasQuery = `
      SELECT id FROM kelas 
      WHERE nama_kelas = ? AND tahun_ajaran_id = ? AND id != ?
    `;

    const checkWaliKelasQuery = `
      SELECT id, nama_kelas FROM kelas 
      WHERE wali_kelas_id = ? AND tahun_ajaran_id = ? AND id != ?
    `;

    db.query(checkNamaKelasQuery, [namaKelas, tahunAjaranId, kelasId], (err1, namaKelasResults) => {
      if (err1) return reject(err1);

      db.query(checkWaliKelasQuery, [waliKelasId, tahunAjaranId, kelasId], (err2, waliKelasResults) => {
        if (err2) return reject(err2);

        if (namaKelasResults.length > 0) {
          return reject(new Error('Nama kelas sudah ada untuk tahun ajaran ini'));
        }

        if (waliKelasResults.length > 0) {
          const existingKelas = waliKelasResults[0];
          return reject(new Error(`Guru ini sudah menjadi wali kelas untuk kelas "${existingKelas.nama_kelas}" pada tahun ajaran ini`));
        }

        const updateQuery = `
          UPDATE kelas 
          SET nama_kelas = ?, wali_kelas_id = ?, tahun_ajaran_id = ?
          WHERE id = ?
        `;

        db.query(updateQuery, [namaKelas, waliKelasId, tahunAjaranId, kelasId], (err3, result) => {
          if (err3) return reject(err3);

          if (result.affectedRows === 0) {
            return reject(new Error('Kelas tidak ditemukan'));
          }

          const getQuery = `
            SELECT 
              k.id,
              k.nama_kelas,
              g.id as wali_kelas_id,
              g.nama_lengkap as wali_kelas_nama,
              g.nip as wali_kelas_nip,
              ta.id as tahun_ajaran_id,
              ta.tahun,
              ta.semester
            FROM kelas k
            LEFT JOIN guru g ON k.wali_kelas_id = g.id
            INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
            WHERE k.id = ?
          `;

          db.query(getQuery, [kelasId], (err4, kelasData) => {
            if (err4) return reject(err4);
            resolve(kelasData[0]);
          });
        });
      });
    });
  });
};

export const getDaftarSiswaKelas = (kelasId, tahunAjaranId = null, page = 1, limit = 20) => {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;

    let tahunAjaranQuery = '';
    let params = [];

    if (!tahunAjaranId) {
      tahunAjaranQuery = `
        SELECT tahun_ajaran_id FROM kelas WHERE id = ?
      `;
      params = [kelasId];
    }

    const siswaQuery = `
      SELECT 
        s.id,
        s.nama_lengkap,
        s.nisn,
        s.jenis_kelamin,
        ROW_NUMBER() OVER (ORDER BY s.nama_lengkap ASC) as no_urut
      FROM siswa s
      INNER JOIN kelas_siswa ks ON s.id = ks.siswa_id
      WHERE ks.kelas_id = ? AND ks.tahun_ajaran_id = ?
      ORDER BY s.nama_lengkap ASC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM siswa s
      INNER JOIN kelas_siswa ks ON s.id = ks.siswa_id
      WHERE ks.kelas_id = ? AND ks.tahun_ajaran_id = ?
    `;

    if (!tahunAjaranId) {
      db.query(tahunAjaranQuery, params, (err1, tahunAjaranResults) => {
        if (err1) return reject(err1);

        if (tahunAjaranResults.length === 0) {
          return reject(new Error('Kelas tidak ditemukan'));
        }

        const tahunAjaranIdFromKelas = tahunAjaranResults[0].tahun_ajaran_id;

        db.query(siswaQuery, [kelasId, tahunAjaranIdFromKelas, limit, offset], (err2, siswaResults) => {
          if (err2) return reject(err2);

          db.query(countQuery, [kelasId, tahunAjaranIdFromKelas], (err3, countResults) => {
            if (err3) return reject(err3);

            resolve({
              data: siswaResults,
              total: countResults[0].total,
              page: page,
              limit: limit,
              totalPages: Math.ceil(countResults[0].total / limit)
            });
          });
        });
      });
    } else {
      db.query(siswaQuery, [kelasId, tahunAjaranId, limit, offset], (err1, siswaResults) => {
        if (err1) return reject(err1);

        db.query(countQuery, [kelasId, tahunAjaranId], (err2, countResults) => {
          if (err2) return reject(err2);

          resolve({
            data: siswaResults,
            total: countResults[0].total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(countResults[0].total / limit)
          });
        });
      });
    }
  });
};

export const bulkTambahSiswaKeKelas = (kelasId, siswaIds, tahunAjaranId) => {
  return new Promise((resolve, reject) => {
    const checkKelasQuery = `
      SELECT 
        k.id,
        k.nama_kelas,
        ta.tahun,
        ta.semester
      FROM kelas k
      INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      WHERE k.id = ? AND ta.id = ?
    `;

    const checkSiswaExistsQuery = `
      SELECT id, nama_lengkap, nisn
      FROM siswa
      WHERE id IN (${siswaIds.map(() => '?').join(',')})
    `;

    const checkSiswaTerdaftarQuery = `
      SELECT 
        ks.siswa_id,
        s.nama_lengkap,
        k.nama_kelas,
        ta.tahun,
        ta.semester
      FROM kelas_siswa ks
      INNER JOIN siswa s ON ks.siswa_id = s.id
      INNER JOIN kelas k ON ks.kelas_id = k.id
      INNER JOIN tahun_ajaran ta ON ks.tahun_ajaran_id = ta.id
      WHERE ks.siswa_id IN (${siswaIds.map(() => '?').join(',')}) 
      AND ks.tahun_ajaran_id = ?
    `;

    db.query(checkKelasQuery, [kelasId, tahunAjaranId], (err1, kelasResults) => {
      if (err1) return reject(err1);

      if (kelasResults.length === 0) {
        return reject(new Error('Kelas atau tahun ajaran tidak ditemukan'));
      }

      db.query(checkSiswaExistsQuery, siswaIds, (err2, siswaResults) => {
        if (err2) return reject(err2);

        if (siswaResults.length !== siswaIds.length) {
          const foundIds = siswaResults.map(s => s.id);
          const notFoundIds = siswaIds.filter(id => !foundIds.includes(id));
          return reject(new Error(`Siswa dengan ID ${notFoundIds.join(', ')} tidak ditemukan`));
        }

        db.query(checkSiswaTerdaftarQuery, [...siswaIds, tahunAjaranId], (err3, terdaftarResults) => {
          if (err3) return reject(err3);

          if (terdaftarResults.length > 0) {
            const terdaftarInfo = terdaftarResults.map(r =>
              `${r.nama_lengkap} (sudah di ${r.nama_kelas} ${r.tahun} ${r.semester})`
            ).join(', ');
            return reject(new Error(`Siswa berikut sudah terdaftar: ${terdaftarInfo}`));
          }

          db.beginTransaction((err4) => {
            if (err4) return reject(err4);

            const insertValues = siswaIds.map(id => [kelasId, id, tahunAjaranId]);
            const insertQuery = `
              INSERT INTO kelas_siswa (kelas_id, siswa_id, tahun_ajaran_id)
              VALUES ?
            `;

            db.query(insertQuery, [insertValues], (err5, result) => {
              if (err5) {
                return db.rollback(() => {
                  reject(err5);
                });
              }

              const getQuery = `
                SELECT 
                  ks.id,
                  s.id as siswa_id,
                  s.nama_lengkap as siswa_nama,
                  s.nisn as siswa_nisn,
                  s.jenis_kelamin as siswa_jenis_kelamin,
                  k.id as kelas_id,
                  k.nama_kelas,
                  ta.id as tahun_ajaran_id,
                  ta.tahun,
                  ta.semester
                FROM kelas_siswa ks
                INNER JOIN siswa s ON ks.siswa_id = s.id
                INNER JOIN kelas k ON ks.kelas_id = k.id
                INNER JOIN tahun_ajaran ta ON ks.tahun_ajaran_id = ta.id
                WHERE ks.id IN (${Array(result.affectedRows).fill('?').join(',')})
              `;

              const insertedIds = Array.from({ length: result.affectedRows }, (_, i) => result.insertId + i);

              db.query(getQuery, insertedIds, (err6, finalResults) => {
                if (err6) {
                  return db.rollback(() => {
                    reject(err6);
                  });
                }

                db.commit((err7) => {
                  if (err7) {
                    return db.rollback(() => {
                      reject(err7);
                    });
                  }

                  resolve({
                    success: finalResults,
                    failed: [],
                    summary: {
                      total: siswaIds.length,
                      success: finalResults.length,
                      failed: 0
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

export const hapusSiswaDariKelas = (kelasId, siswaId, tahunAjaranId) => {
  return new Promise((resolve, reject) => {
    const checkSiswaQuery = `
      SELECT 
        ks.id,
        s.nama_lengkap,
        s.nisn,
        k.nama_kelas,
        ta.tahun,
        ta.semester
      FROM kelas_siswa ks
      INNER JOIN siswa s ON ks.siswa_id = s.id
      INNER JOIN kelas k ON ks.kelas_id = k.id
      INNER JOIN tahun_ajaran ta ON ks.tahun_ajaran_id = ta.id
      WHERE ks.kelas_id = ? AND ks.siswa_id = ? AND ks.tahun_ajaran_id = ?
    `;

    const checkKelasQuery = `
      SELECT 
        k.id,
        k.nama_kelas,
        ta.tahun,
        ta.semester
      FROM kelas k
      INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      WHERE k.id = ? AND ta.id = ?
    `;

    const checkSiswaExistsQuery = `
      SELECT id, nama_lengkap, nisn
      FROM siswa
      WHERE id = ?
    `;

    db.query(checkSiswaExistsQuery, [siswaId], (err1, siswaResults) => {
      if (err1) return reject(err1);

      if (siswaResults.length === 0) {
        return reject(new Error('Siswa tidak ditemukan'));
      }

      db.query(checkKelasQuery, [kelasId, tahunAjaranId], (err2, kelasResults) => {
        if (err2) return reject(err2);

        if (kelasResults.length === 0) {
          return reject(new Error('Kelas atau tahun ajaran tidak ditemukan'));
        }

        db.query(checkSiswaQuery, [kelasId, siswaId, tahunAjaranId], (err3, existingSiswaResults) => {
          if (err3) return reject(err3);

          if (existingSiswaResults.length === 0) {
            return reject(new Error('Siswa tidak ditemukan di kelas ini'));
          }

          const siswaData = existingSiswaResults[0];

          const deleteQuery = `
            DELETE FROM kelas_siswa 
            WHERE kelas_id = ? AND siswa_id = ? AND tahun_ajaran_id = ?
          `;

          db.query(deleteQuery, [kelasId, siswaId, tahunAjaranId], (err4, result) => {
            if (err4) return reject(err4);

            if (result.affectedRows === 0) {
              return reject(new Error('Gagal menghapus siswa dari kelas'));
            }

            resolve({
              id: siswaData.id,
              siswa_id: siswaId,
              siswa_nama: siswaData.nama_lengkap,
              siswa_nisn: siswaData.nisn,
              kelas_id: kelasId,
              nama_kelas: siswaData.nama_kelas,
              tahun_ajaran_id: tahunAjaranId,
              tahun: siswaData.tahun,
              semester: siswaData.semester,
              message: `Siswa ${siswaData.nama_lengkap} berhasil dihapus dari ${siswaData.nama_kelas}`
            });
          });
        });
      });
    });
  });
};

export const tambahSiswaKeKelas = (kelasId, siswaId, tahunAjaranId) => {
  return new Promise((resolve, reject) => {
    const checkSiswaQuery = `
      SELECT 
        ks.id,
        k.nama_kelas,
        ta.tahun,
        ta.semester
      FROM kelas_siswa ks
      INNER JOIN kelas k ON ks.kelas_id = k.id
      INNER JOIN tahun_ajaran ta ON ks.tahun_ajaran_id = ta.id
      WHERE ks.siswa_id = ? AND ks.tahun_ajaran_id = ?
    `;

    const checkKelasQuery = `
      SELECT 
        k.id,
        k.nama_kelas,
        ta.tahun,
        ta.semester
      FROM kelas k
      INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      WHERE k.id = ? AND ta.id = ?
    `;

    const checkSiswaExistsQuery = `
      SELECT id, nama_lengkap, nisn
      FROM siswa
      WHERE id = ?
    `;

    db.query(checkSiswaExistsQuery, [siswaId], (err1, siswaResults) => {
      if (err1) return reject(err1);

      if (siswaResults.length === 0) {
        return reject(new Error('Siswa tidak ditemukan'));
      }

      db.query(checkKelasQuery, [kelasId, tahunAjaranId], (err2, kelasResults) => {
        if (err2) return reject(err2);

        if (kelasResults.length === 0) {
          return reject(new Error('Kelas atau tahun ajaran tidak ditemukan'));
        }

        db.query(checkSiswaQuery, [siswaId, tahunAjaranId], (err3, existingSiswaResults) => {
          if (err3) return reject(err3);

          if (existingSiswaResults.length > 0) {
            const existingKelas = existingSiswaResults[0];
            return reject(new Error(`Siswa sudah terdaftar di kelas "${existingKelas.nama_kelas}" pada tahun ajaran ${existingKelas.tahun} ${existingKelas.semester}`));
          }

          const insertQuery = `
            INSERT INTO kelas_siswa (kelas_id, siswa_id, tahun_ajaran_id)
            VALUES (?, ?, ?)
          `;

          db.query(insertQuery, [kelasId, siswaId, tahunAjaranId], (err4, result) => {
            if (err4) return reject(err4);

            const getQuery = `
              SELECT 
                ks.id,
                s.id as siswa_id,
                s.nama_lengkap as siswa_nama,
                s.nisn as siswa_nisn,
                s.jenis_kelamin as siswa_jenis_kelamin,
                k.id as kelas_id,
                k.nama_kelas,
                ta.id as tahun_ajaran_id,
                ta.tahun,
                ta.semester
              FROM kelas_siswa ks
              INNER JOIN siswa s ON ks.siswa_id = s.id
              INNER JOIN kelas k ON ks.kelas_id = k.id
              INNER JOIN tahun_ajaran ta ON ks.tahun_ajaran_id = ta.id
              WHERE ks.id = ?
            `;

            db.query(getQuery, [result.insertId], (err5, finalResults) => {
              if (err5) return reject(err5);
              resolve(finalResults[0]);
            });
          });
        });
      });
    });
  });
};

export const searchSiswa = (query, tahunAjaranId, limit = 20) => {
  return new Promise((resolve, reject) => {
    const searchQuery = `
      SELECT 
        s.id,
        s.nama_lengkap,
        s.nisn,
        s.jenis_kelamin
      FROM siswa s
      WHERE (s.nama_lengkap LIKE ? OR s.nisn LIKE ?)
      AND s.id NOT IN (
        SELECT ks.siswa_id 
        FROM kelas_siswa ks 
        WHERE ks.tahun_ajaran_id = ?
      )
      ORDER BY s.nama_lengkap ASC
      LIMIT ?
    `;

    const searchPattern = `%${query}%`;
    const params = [searchPattern, searchPattern, tahunAjaranId, limit];

    db.query(searchQuery, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

export const getAvailableSiswa = (tahunAjaranId, page = 1, limit = 50) => {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;

    const siswaQuery = `
      SELECT 
        s.id,
        s.nama_lengkap,
        s.nisn,
        s.jenis_kelamin
      FROM siswa s
      WHERE s.id NOT IN (
        SELECT ks.siswa_id 
        FROM kelas_siswa ks 
        WHERE ks.tahun_ajaran_id = ?
      )
      ORDER BY s.nama_lengkap ASC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM siswa s
      WHERE s.id NOT IN (
        SELECT ks.siswa_id 
        FROM kelas_siswa ks 
        WHERE ks.tahun_ajaran_id = ?
      )
    `;

    db.query(siswaQuery, [tahunAjaranId, limit, offset], (err1, siswaResults) => {
      if (err1) return reject(err1);

      db.query(countQuery, [tahunAjaranId], (err2, countResults) => {
        if (err2) return reject(err2);

        resolve({
          data: siswaResults,
          total: countResults[0].total,
          page: page,
          limit: limit,
          totalPages: Math.ceil(countResults[0].total / limit)
        });
      });
    });
  });
};

export const getInfoKelas = (kelasId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        k.id,
        k.nama_kelas,
        g.id as wali_kelas_id,
        g.nama_lengkap as wali_kelas_nama,
        g.nip as wali_kelas_nip,
        ta.id as tahun_ajaran_id,
        ta.tahun,
        ta.semester,
        ta.status as status_tahun_ajaran,
        (SELECT COUNT(*) FROM kelas_siswa ks WHERE ks.kelas_id = k.id) as jumlah_siswa,
        (SELECT COUNT(*) FROM kelas_mapel km WHERE km.kelas_id = k.id) as jumlah_mata_pelajaran
      FROM kelas k
      LEFT JOIN guru g ON k.wali_kelas_id = g.id
      INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      WHERE k.id = ?
    `;

    db.query(query, [kelasId], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0 ? results[0] : null);
    });
  });
};

export const getNaikKelasInfo = (kelasId) => {
  return new Promise((resolve, reject) => {
    const kelasAsalQuery = `
      SELECT 
        k.id,
        k.nama_kelas,
        ta.id as tahun_ajaran_id,
        ta.tahun,
        ta.semester,
        COUNT(DISTINCT ks.siswa_id) as total_siswa
      FROM kelas k
      INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      LEFT JOIN kelas_siswa ks ON k.id = ks.kelas_id AND ks.tahun_ajaran_id = ta.id
      WHERE k.id = ?
      GROUP BY k.id, k.nama_kelas, ta.id, ta.tahun, ta.semester
    `;

    db.query(kelasAsalQuery, [kelasId], (err, kelasResults) => {
      if (err) return reject(err);

      if (kelasResults.length === 0) {
        return reject(new Error('Kelas tidak ditemukan'));
      }

      const kelasAsal = kelasResults[0];

      let tahunTujuan, semesterTujuan;

      if (kelasAsal.semester === 'Ganjil') {
        tahunTujuan = kelasAsal.tahun;
        semesterTujuan = 'Genap';
      } else {
        const [tahunMulai, tahunAkhir] = kelasAsal.tahun.split('/');
        const tahunMulaiBaru = parseInt(tahunAkhir);
        const tahunAkhirBaru = tahunMulaiBaru + 1;
        tahunTujuan = `${tahunMulaiBaru}/${tahunAkhirBaru}`;
        semesterTujuan = 'Ganjil';
      }

      const tahunAjaranTujuanQuery = `
        SELECT 
          id,
          tahun,
          semester,
          status
        FROM tahun_ajaran
        WHERE tahun = ? AND semester = ?
        LIMIT 1
      `;

      db.query(tahunAjaranTujuanQuery, [tahunTujuan, semesterTujuan], (err2, tahunResults) => {
        if (err2) return reject(err2);

        const result = {
          kelas_asal: {
            id: kelasAsal.id,
            nama_kelas: kelasAsal.nama_kelas,
            tahun_ajaran_id: kelasAsal.tahun_ajaran_id,
            tahun: kelasAsal.tahun,
            semester: kelasAsal.semester,
            total_siswa: kelasAsal.total_siswa
          },
          tahun_ajaran_tujuan: tahunResults.length > 0 ? {
            id: tahunResults[0].id,
            tahun: tahunResults[0].tahun,
            semester: tahunResults[0].semester,
            status: tahunResults[0].status
          } : null
        };

        resolve(result);
      });
    });
  });
};

export const getDaftarMataPelajaranKelas = (kelasId, tahunAjaranId = null, page = 1, limit = 20) => {
  return new Promise((resolve, reject) => {
    const getKelasQuery = `
      SELECT 
        k.id,
        k.nama_kelas,
        g.nama_lengkap as wali_kelas,
        ta.id as tahun_ajaran_id,
        ta.tahun,
        ta.semester
      FROM kelas k
      INNER JOIN guru g ON k.wali_kelas_id = g.id
      INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      WHERE k.id = ?
    `;

    db.query(getKelasQuery, [kelasId], (err1, kelasResults) => {
      if (err1) return reject(err1);

      if (kelasResults.length === 0) {
        return reject(new Error('Kelas tidak ditemukan'));
      }

      const kelasInfo = kelasResults[0];
      const targetTahunAjaranId = tahunAjaranId || kelasInfo.tahun_ajaran_id;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM kelas_mapel km
        WHERE km.kelas_id = ? AND km.tahun_ajaran_id = ?
      `;

      db.query(countQuery, [kelasId, targetTahunAjaranId], (err2, countResults) => {
        if (err2) return reject(err2);

        const totalMapel = countResults[0].total;

        const offset = (page - 1) * limit;
        const listQuery = `
          SELECT 
            km.id,
            mp.id as mata_pelajaran_id,
            mp.nama_mapel,
            g.id as guru_id,
            g.nama_lengkap as guru_pengampu,
            g.nip as nip_guru
          FROM kelas_mapel km
          INNER JOIN mapel mp ON km.mapel_id = mp.id
          INNER JOIN guru g ON km.guru_id = g.id
          WHERE km.kelas_id = ? AND km.tahun_ajaran_id = ?
          ORDER BY mp.nama_mapel ASC
          LIMIT ? OFFSET ?
        `;

        db.query(listQuery, [kelasId, targetTahunAjaranId, limit, offset], (err3, mapelResults) => {
          if (err3) return reject(err3);

          const result = {
            info_kelas: {
              id: kelasInfo.id,
              nama_kelas: kelasInfo.nama_kelas,
              wali_kelas: kelasInfo.wali_kelas,
              tahun: kelasInfo.tahun,
              semester: kelasInfo.semester,
              jumlah_mapel: totalMapel
            },
            mata_pelajaran: mapelResults,
            pagination: {
              current_page: page,
              per_page: limit,
              total: totalMapel,
              total_pages: Math.ceil(totalMapel / limit)
            }
          };

          resolve(result);
        });
      });
    });
  });
};

export const executeNaikKelas = (kelasAsalId, kelasTujuanId, tahunAjaranTujuanId, siswaIds) => {
  return new Promise((resolve, reject) => {
    const kelasAsalQuery = `
      SELECT 
        k.id,
        k.nama_kelas,
        ta.id as tahun_ajaran_id,
        ta.tahun,
        ta.semester
      FROM kelas k
      INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      WHERE k.id = ?
    `;

    db.query(kelasAsalQuery, [kelasAsalId], (err1, kelasAsalResults) => {
      if (err1) return reject(err1);

      if (kelasAsalResults.length === 0) {
        return reject(new Error('Kelas asal tidak ditemukan'));
      }

      const kelasAsal = kelasAsalResults[0];

      const kelasTujuanQuery = `
        SELECT 
          k.id,
          k.nama_kelas,
          ta.id as tahun_ajaran_id,
          ta.tahun,
          ta.semester
        FROM kelas k
        INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
        WHERE k.id = ? AND ta.id = ?
      `;

      db.query(kelasTujuanQuery, [kelasTujuanId, tahunAjaranTujuanId], (err2, kelasTujuanResults) => {
        if (err2) return reject(err2);

        if (kelasTujuanResults.length === 0) {
          return reject(new Error('Kelas tujuan atau tahun ajaran tujuan tidak ditemukan'));
        }

        const kelasTujuan = kelasTujuanResults[0];

        const placeholders = siswaIds.map(() => '?').join(',');
        const validasiSiswaQuery = `
          SELECT 
            s.id,
            s.nama_lengkap,
            s.nisn,
            CASE 
              WHEN ks.siswa_id IS NOT NULL THEN 1
              ELSE 0
            END as ada_di_kelas_asal
          FROM siswa s
          LEFT JOIN kelas_siswa ks ON s.id = ks.siswa_id 
            AND ks.kelas_id = ? 
            AND ks.tahun_ajaran_id = ?
          WHERE s.id IN (${placeholders})
        `;

        db.query(validasiSiswaQuery, [kelasAsalId, kelasAsal.tahun_ajaran_id, ...siswaIds], (err3, siswaResults) => {
          if (err3) return reject(err3);

          if (siswaResults.length !== siswaIds.length) {
            return reject(new Error('Beberapa siswa tidak ditemukan'));
          }

          const siswaTidakDiKelas = siswaResults.filter(s => s.ada_di_kelas_asal === 0);
          if (siswaTidakDiKelas.length > 0) {
            return reject(new Error(`Siswa ${siswaTidakDiKelas[0].nama_lengkap} tidak terdaftar di kelas asal`));
          }

          const cekDuplikatQuery = `
            SELECT 
              s.id,
              s.nama_lengkap,
              k.nama_kelas
            FROM kelas_siswa ks
            INNER JOIN siswa s ON ks.siswa_id = s.id
            INNER JOIN kelas k ON ks.kelas_id = k.id
            WHERE ks.siswa_id IN (${placeholders})
              AND ks.kelas_id = ?
              AND ks.tahun_ajaran_id = ?
          `;

          db.query(cekDuplikatQuery, [...siswaIds, kelasTujuanId, tahunAjaranTujuanId], (err4, duplikatResults) => {
            if (err4) return reject(err4);

            if (duplikatResults.length > 0) {
              return reject(new Error(`Siswa ${duplikatResults[0].nama_lengkap} sudah terdaftar di kelas ${duplikatResults[0].nama_kelas}`));
            }

            db.beginTransaction((errTrans) => {
              if (errTrans) return reject(errTrans);

              const insertValues = siswaIds.map(siswaId => [kelasTujuanId, siswaId, tahunAjaranTujuanId]);
              const insertQuery = `
                INSERT INTO kelas_siswa (kelas_id, siswa_id, tahun_ajaran_id)
                VALUES ?
              `;

              db.query(insertQuery, [insertValues], (errInsert) => {
                if (errInsert) {
                  return db.rollback(() => {
                    reject(errInsert);
                  });
                }

                db.commit((errCommit) => {
                  if (errCommit) {
                    return db.rollback(() => {
                      reject(errCommit);
                    });
                  }

                  const result = {
                    summary: {
                      total_diproses: siswaIds.length,
                      berhasil: siswaIds.length,
                      gagal: 0,
                      kelas_asal: `${kelasAsal.nama_kelas} (${kelasAsal.tahun} - ${kelasAsal.semester})`,
                      kelas_tujuan: `${kelasTujuan.nama_kelas} (${kelasTujuan.tahun} - ${kelasTujuan.semester})`
                    },
                    detail: siswaResults.map(siswa => ({
                      siswa_id: siswa.id,
                      nama: siswa.nama_lengkap,
                      nisn: siswa.nisn,
                      status: 'berhasil',
                      message: `Berhasil dinaikkan ke ${kelasTujuan.nama_kelas}`
                    }))
                  };

                  resolve(result);
                });
              });
            });
          });
        });
      });
    });
  });
};

export const getDropdownMataPelajaran = (kelasId = null, tahunAjaranId = null) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        m.id,
        m.nama_mapel
      FROM mapel m
    `;

    const params = [];

    if (kelasId && tahunAjaranId) {
      query += `
        WHERE m.id NOT IN (
          SELECT km.mapel_id 
          FROM kelas_mapel km 
          WHERE km.kelas_id = ? AND km.tahun_ajaran_id = ?
        )
      `;
      params.push(kelasId, tahunAjaranId);
    }

    query += ` ORDER BY m.nama_mapel ASC`;

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

export const getDropdownGuru = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id,
        nama_lengkap,
        nip
      FROM guru 
      WHERE status = 'aktif'
      ORDER BY nama_lengkap ASC
    `;

    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

export const getDropdownGuruEdit = (excludeGuruId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        g.id,
        g.nama_lengkap,
        g.nip
      FROM guru g
      WHERE g.status = 'aktif'
      ORDER BY g.nama_lengkap ASC
    `;

    db.query(query, [], (err, results) => {
      if (err) return reject(err);

      if (excludeGuruId) {
        const guruExists = results.find(guru => guru.id === parseInt(excludeGuruId));
        if (!guruExists) {
          const excludeQuery = `
            SELECT 
              g.id,
              g.nama_lengkap,
              g.nip
            FROM guru g
            WHERE g.id = ? AND g.status = 'aktif'
          `;
          db.query(excludeQuery, [excludeGuruId], (err2, excludeResults) => {
            if (err2) return reject(err2);
            if (excludeResults.length > 0) {
              results.unshift(excludeResults[0]);
            }
            resolve(results);
          });
        } else {
          resolve(results);
        }
      } else {
        resolve(results);
      }
    });
  });
};

export const tambahMataPelajaranKeKelas = (kelasId, mapelId, guruId, tahunAjaranId) => {
  return new Promise((resolve, reject) => {
    const cekDuplikatQuery = `
      SELECT COUNT(*) as jumlah
      FROM kelas_mapel 
      WHERE kelas_id = ? AND mapel_id = ? AND tahun_ajaran_id = ?
    `;

    db.query(cekDuplikatQuery, [kelasId, mapelId, tahunAjaranId], (err1, duplikatResults) => {
      if (err1) return reject(err1);

      if (duplikatResults[0].jumlah > 0) {
        return reject(new Error('Mata pelajaran sudah terdaftar di kelas ini untuk tahun ajaran yang sama'));
      }

      const insertQuery = `
        INSERT INTO kelas_mapel (kelas_id, mapel_id, guru_id, tahun_ajaran_id)
        VALUES (?, ?, ?, ?)
      `;

      db.query(insertQuery, [kelasId, mapelId, guruId, tahunAjaranId], (err2, insertResults) => {
        if (err2) return reject(err2);

        const getDataQuery = `
          SELECT 
            km.id,
            m.id as mata_pelajaran_id,
            m.nama_mapel,
            g.id as guru_id,
            g.nama_lengkap as guru_pengampu,
            g.nip as nip_guru
          FROM kelas_mapel km
          INNER JOIN mapel m ON km.mapel_id = m.id
          INNER JOIN guru g ON km.guru_id = g.id
          WHERE km.id = ?
        `;

        db.query(getDataQuery, [insertResults.insertId], (err3, dataResults) => {
          if (err3) return reject(err3);

          resolve(dataResults[0]);
        });
      });
    });
  });
};

export const tambahMataPelajaranBaru = (namaMapel) => {
  return new Promise((resolve, reject) => {
    const cekDuplikatQuery = `
      SELECT COUNT(*) as jumlah
      FROM mapel 
      WHERE nama_mapel = ?
    `;

    db.query(cekDuplikatQuery, [namaMapel], (err1, duplikatResults) => {
      if (err1) return reject(err1);

      if (duplikatResults[0].jumlah > 0) {
        return reject(new Error('Mata pelajaran dengan nama ini sudah ada'));
      }

      const insertQuery = `
        INSERT INTO mapel (nama_mapel)
        VALUES (?)
      `;

      db.query(insertQuery, [namaMapel], (err2, insertResults) => {
        if (err2) return reject(err2);

        const getDataQuery = `
          SELECT 
            id,
            nama_mapel
          FROM mapel 
          WHERE id = ?
        `;

        db.query(getDataQuery, [insertResults.insertId], (err3, dataResults) => {
          if (err3) return reject(err3);

          resolve(dataResults[0]);
        });
      });
    });
  });
};

export const deleteKelas = (kelasId) => {
  return new Promise((resolve, reject) => {
    const checkSiswaQuery = `
      SELECT COUNT(*) as jumlah_siswa 
      FROM kelas_siswa 
      WHERE kelas_id = ?
    `;

    const checkMapelQuery = `
      SELECT COUNT(*) as jumlah_mapel 
      FROM kelas_mapel 
      WHERE kelas_id = ?
    `;

    db.query(checkSiswaQuery, [kelasId], (err1, siswaResults) => {
      if (err1) return reject(err1);

      db.query(checkMapelQuery, [kelasId], (err2, mapelResults) => {
        if (err2) return reject(err2);

        const jumlahSiswa = siswaResults[0].jumlah_siswa;
        const jumlahMapel = mapelResults[0].jumlah_mapel;

        if (jumlahSiswa > 0) {
          return reject(new Error(`Kelas tidak dapat dihapus karena masih memiliki ${jumlahSiswa} siswa`));
        }

        if (jumlahMapel > 0) {
          return reject(new Error(`Kelas tidak dapat dihapus karena masih memiliki ${jumlahMapel} mata pelajaran`));
        }

        const getKelasQuery = `
          SELECT 
            k.id,
            k.nama_kelas,
            g.id as wali_kelas_id,
            g.nama_lengkap as wali_kelas_nama,
            g.nip as wali_kelas_nip,
            ta.id as tahun_ajaran_id,
            ta.tahun,
            ta.semester
          FROM kelas k
          LEFT JOIN guru g ON k.wali_kelas_id = g.id
          INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
          WHERE k.id = ?
        `;

        db.query(getKelasQuery, [kelasId], (err3, kelasData) => {
          if (err3) return reject(err3);

          if (kelasData.length === 0) {
            return reject(new Error('Kelas tidak ditemukan'));
          }

          const deleteQuery = `DELETE FROM kelas WHERE id = ?`;

          db.query(deleteQuery, [kelasId], (err4, result) => {
            if (err4) return reject(err4);

            if (result.affectedRows === 0) {
              return reject(new Error('Kelas tidak ditemukan'));
            }

            resolve(kelasData[0]);
          });
        });
      });
    });
  });
};

export const getDetailMataPelajaranKelas = (kelasId, mapelId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        km.id,
        km.mapel_id,
        mp.nama_mapel,
        km.guru_id,
        g.nama_lengkap as guru_nama,
        g.nip as nip_guru,
        km.kelas_id,
        km.tahun_ajaran_id
      FROM kelas_mapel km
      INNER JOIN mapel mp ON km.mapel_id = mp.id
      INNER JOIN guru g ON km.guru_id = g.id
      WHERE km.kelas_id = ? AND km.id = ?
    `;

    db.query(query, [kelasId, mapelId], (err, results) => {
      if (err) return reject(err);

      if (results.length === 0) {
        return reject(new Error('Mata pelajaran tidak ditemukan di kelas ini'));
      }

      resolve(results[0]);
    });
  });
};

export const getDropdownMataPelajaranEdit = (kelasId, tahunAjaranId, excludeMapelId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        mp.id,
        mp.nama_mapel
      FROM mapel mp
      WHERE mp.id NOT IN (
        SELECT km.mapel_id 
        FROM kelas_mapel km 
        WHERE km.kelas_id = ? AND km.tahun_ajaran_id = ?
      ) OR mp.id = ?
      ORDER BY mp.nama_mapel ASC
    `;

    db.query(query, [kelasId, tahunAjaranId, excludeMapelId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

export const updateMataPelajaranKelas = (kelasId, mapelId, newMapelId, guruId, tahunAjaranId) => {
  return new Promise((resolve, reject) => {
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM kelas_mapel 
      WHERE kelas_id = ? AND mapel_id = ? AND tahun_ajaran_id = ? AND id != ?
    `;

    db.query(checkQuery, [kelasId, newMapelId, tahunAjaranId, mapelId], (err1, checkResults) => {
      if (err1) return reject(err1);

      if (checkResults[0].count > 0) {
        return reject(new Error('Mata pelajaran ini sudah ada di kelas ini'));
      }

      const updateQuery = `
        UPDATE kelas_mapel 
        SET mapel_id = ?, guru_id = ?
        WHERE id = ? AND kelas_id = ?
      `;

      db.query(updateQuery, [newMapelId, guruId, mapelId, kelasId], (err2, result) => {
        if (err2) return reject(err2);

        if (result.affectedRows === 0) {
          return reject(new Error('Mata pelajaran tidak ditemukan di kelas ini'));
        }

        const getQuery = `
          SELECT 
            km.id,
            km.mapel_id,
            mp.nama_mapel,
            km.guru_id,
            g.nama_lengkap as guru_nama,
            g.nip as nip_guru
          FROM kelas_mapel km
          INNER JOIN mapel mp ON km.mapel_id = mp.id
          INNER JOIN guru g ON km.guru_id = g.id
          WHERE km.id = ?
        `;

        db.query(getQuery, [mapelId], (err3, updatedData) => {
          if (err3) return reject(err3);
          resolve(updatedData[0]);
        });
      });
    });
  });
};

export const hapusMataPelajaranKelas = (kelasId, mapelId) => {
  return new Promise((resolve, reject) => {
    const getDataQuery = `
      SELECT 
        km.id,
        km.mapel_id,
        mp.nama_mapel,
        km.guru_id,
        g.nama_lengkap as guru_nama,
        g.nip as nip_guru,
        km.kelas_id,
        k.nama_kelas,
        km.tahun_ajaran_id,
        ta.tahun,
        ta.semester
      FROM kelas_mapel km
      INNER JOIN mapel mp ON km.mapel_id = mp.id
      INNER JOIN guru g ON km.guru_id = g.id
      INNER JOIN kelas k ON km.kelas_id = k.id
      INNER JOIN tahun_ajaran ta ON km.tahun_ajaran_id = ta.id
      WHERE km.kelas_id = ? AND km.id = ?
    `;

    db.query(getDataQuery, [kelasId, mapelId], (err1, dataResults) => {
      if (err1) return reject(err1);

      if (dataResults.length === 0) {
        return reject(new Error('Mata pelajaran tidak ditemukan di kelas ini'));
      }

      const mataPelajaranData = dataResults[0];

      const deleteQuery = `
        DELETE FROM kelas_mapel 
        WHERE kelas_id = ? AND id = ?
      `;

      db.query(deleteQuery, [kelasId, mapelId], (err2, result) => {
        if (err2) return reject(err2);

        if (result.affectedRows === 0) {
          return reject(new Error('Gagal menghapus mata pelajaran dari kelas'));
        }

        resolve({
          id: mataPelajaranData.id,
          mapel_id: mataPelajaranData.mapel_id,
          nama_mapel: mataPelajaranData.nama_mapel,
          guru_id: mataPelajaranData.guru_id,
          guru_nama: mataPelajaranData.guru_nama,
          nip_guru: mataPelajaranData.nip_guru,
          kelas_id: mataPelajaranData.kelas_id,
          nama_kelas: mataPelajaranData.nama_kelas,
          tahun_ajaran_id: mataPelajaranData.tahun_ajaran_id,
          tahun: mataPelajaranData.tahun,
          semester: mataPelajaranData.semester,
          message: `Mata pelajaran ${mataPelajaranData.nama_mapel} berhasil dihapus dari ${mataPelajaranData.nama_kelas}`
        });
      });
    });
  });
};
