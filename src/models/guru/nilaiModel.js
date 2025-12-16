import db from '../../config/db.js';

export const getKelasByGuru = (guruId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT
        k.id as kelas_id,
        k.nama_kelas
      FROM kelas k
      JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      WHERE ta.status = 'aktif'
        AND (
          k.wali_kelas_id = ?
          OR EXISTS (
            SELECT 1 FROM kelas_mapel km
            WHERE km.kelas_id = k.id
              AND km.guru_id = ?
              AND km.tahun_ajaran_id = ta.id
          )
        )
      ORDER BY k.nama_kelas ASC
    `;

    db.query(query, [guruId, guruId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

export const getMapelByGuruAndKelas = (guruId, kelasId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT
        m.id as mapel_id,
        m.nama_mapel
      FROM kelas_mapel km
      JOIN mapel m ON km.mapel_id = m.id
      JOIN tahun_ajaran ta ON km.tahun_ajaran_id = ta.id
      WHERE km.guru_id = ?
        AND km.kelas_id = ?
        AND ta.status = 'aktif'
      ORDER BY m.nama_mapel ASC
    `;

    db.query(query, [guruId, kelasId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

export const getTahunAjaranAktif = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id as tahun_ajaran_id,
        tahun as nama_tahun_ajaran,
        semester,
        status
      FROM tahun_ajaran
      WHERE status = 'aktif'
      LIMIT 1
    `;

    db.query(query, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0] || null);
    });
  });
};


export const getSiswaWithNilai = (kelasId, mapelId, tahunAjaranId, semester) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        s.id as siswa_id,
        s.nama_lengkap as nama_siswa,
        s.nisn,
        -- Formatif (20 fields)
        n.lm1_tp1, n.lm1_tp2, n.lm1_tp3, n.lm1_tp4,
        n.lm2_tp1, n.lm2_tp2, n.lm2_tp3, n.lm2_tp4,
        n.lm3_tp1, n.lm3_tp2, n.lm3_tp3, n.lm3_tp4,
        n.lm4_tp1, n.lm4_tp2, n.lm4_tp3, n.lm4_tp4,
        n.lm5_tp1, n.lm5_tp2, n.lm5_tp3, n.lm5_tp4,
        -- Sumatif LM (5 fields)
        n.lm1_ulangan, n.lm2_ulangan, n.lm3_ulangan, n.lm4_ulangan, n.lm5_ulangan,
        -- UTS & UAS
        n.uts, n.uas,
        -- Nilai Akhir (auto-calculated by DB trigger)
        n.nilai_akhir
      FROM kelas_siswa ks
      JOIN siswa s ON ks.siswa_id = s.id
      LEFT JOIN nilai n ON s.id = n.siswa_id 
        AND n.kelas_id = ks.kelas_id
        AND n.mapel_id = ?
        AND n.tahun_ajaran_id = ?
        AND n.semester = ?
      WHERE ks.kelas_id = ?
        AND ks.tahun_ajaran_id = ?
      ORDER BY s.nama_lengkap ASC
    `;

    db.query(
      query,
      [mapelId, tahunAjaranId, semester, kelasId, tahunAjaranId],
      (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results);
      }
    );
  });
};


export const getKelasById = (kelasId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id as kelas_id, nama_kelas
      FROM kelas
      WHERE id = ?
    `;

    db.query(query, [kelasId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0] || null);
    });
  });
};


export const getMapelById = (mapelId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id as mapel_id, nama_mapel
      FROM mapel
      WHERE id = ?
    `;

    db.query(query, [mapelId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0] || null);
    });
  });
};


export const simpanCell = (data) => {
  return new Promise((resolve, reject) => {
    const { siswa_id, kelas_id, mapel_id, tahun_ajaran_id, semester, field, nilai, updated_by } = data;
    const insertQuery = `
      INSERT IGNORE INTO nilai (
        siswa_id, kelas_id, mapel_id, tahun_ajaran_id, semester,
        created_by, updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    db.query(
      insertQuery,
      [siswa_id, kelas_id, mapel_id, tahun_ajaran_id, semester, updated_by, updated_by],
      (insertError) => {
        if (insertError) {
          return reject(insertError);
        }
        const updateQuery = `
          UPDATE nilai
          SET ${field} = ?,
              updated_by = ?,
              updated_at = NOW()
          WHERE siswa_id = ?
            AND kelas_id = ?
            AND mapel_id = ?
            AND tahun_ajaran_id = ?
            AND semester = ?
        `;

        db.query(
          updateQuery,
          [nilai, updated_by, siswa_id, kelas_id, mapel_id, tahun_ajaran_id, semester],
          (updateError, results) => {
            if (updateError) {
              return reject(updateError);
            }
            resolve({
              success: true,
              affectedRows: results.affectedRows,
              action: 'UPDATE'
            });
          }
        );
      }
    );
  });
};

export default {
  getKelasByGuru,
  getMapelByGuruAndKelas,
  getTahunAjaranAktif,
  getSiswaWithNilai,
  getKelasById,
  getMapelById,
  simpanCell
};

