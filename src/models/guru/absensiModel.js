import db from '../../config/db.js';

export const getKelasWaliKelas = (guruId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        k.id as kelas_id,
        k.nama_kelas,
        ta.tahun,
        ta.semester,
        (SELECT COUNT(*) FROM kelas_siswa ks WHERE ks.kelas_id = k.id AND ks.tahun_ajaran_id = ta.id) as total_siswa
      FROM kelas k
      JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      WHERE k.wali_kelas_id = ?
        AND ta.status = 'aktif'
      LIMIT 1
    `;

    db.query(query, [guruId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0] || null);
    });
  });
};

export const getSiswaWithAbsensi = (kelasId, tanggal) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        s.id as siswa_id,
        s.nisn,
        s.nama_lengkap as nama_siswa,
        a.id as absensi_id,
        a.status as status_absensi,
        a.guru_id as input_by_guru_id
      FROM kelas_siswa ks
      JOIN siswa s ON ks.siswa_id = s.id
      JOIN tahun_ajaran ta ON ks.tahun_ajaran_id = ta.id
      LEFT JOIN absensi a ON s.id = a.siswa_id 
        AND a.kelas_id = ks.kelas_id 
        AND a.tanggal = ?
      WHERE ks.kelas_id = ?
        AND ta.status = 'aktif'
      ORDER BY s.nama_lengkap ASC
    `;

    db.query(query, [tanggal, kelasId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};


export const verifyWaliKelas = (kelasId, guruId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        k.id as kelas_id,
        k.nama_kelas,
        ta.tahun,
        ta.semester
      FROM kelas k
      JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      WHERE k.id = ?
        AND k.wali_kelas_id = ?
        AND ta.status = 'aktif'
      LIMIT 1
    `;

    db.query(query, [kelasId, guruId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0] || null);
    });
  });
};


export const getGuruRoleInKelas = (kelasId, guruId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        k.id as kelas_id,
        k.nama_kelas,
        ta.tahun,
        ta.semester,
        CASE 
          WHEN k.wali_kelas_id = ? THEN 'Wali Kelas'
          ELSE 'Guru Mapel'
        END as role_guru
      FROM kelas k
      JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      WHERE k.id = ?
        AND ta.status = 'aktif'
        AND (
          k.wali_kelas_id = ?
          OR EXISTS (
            SELECT 1 FROM kelas_mapel km 
            WHERE km.kelas_id = k.id 
              AND km.guru_id = ?
              AND km.tahun_ajaran_id = ta.id
          )
        )
      LIMIT 1
    `;

    db.query(query, [guruId, kelasId, guruId, guruId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0] || null);
    });
  });
};


export const getKelasByGuru = (guruId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT
        k.id as kelas_id,
        k.nama_kelas,
        k.wali_kelas_id,
        CASE 
          WHEN k.wali_kelas_id = ? THEN 'Wali Kelas'
          ELSE 'Guru Mapel'
        END as role_guru,
        (SELECT COUNT(*) FROM kelas_siswa ks WHERE ks.kelas_id = k.id AND ks.tahun_ajaran_id = ta.id) as total_siswa,
        (
          SELECT m.nama_mapel 
          FROM kelas_mapel km 
          JOIN mapel m ON km.mapel_id = m.id
          WHERE km.kelas_id = k.id 
            AND km.guru_id = ?
            AND km.tahun_ajaran_id = ta.id
          LIMIT 1
        ) as mata_pelajaran
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
      ORDER BY 
        CASE WHEN k.wali_kelas_id = ? THEN 0 ELSE 1 END,
        k.nama_kelas
    `;

    db.query(query, [guruId, guruId, guruId, guruId, guruId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};


export const saveAbsensi = (siswaId, kelasId, tanggal, status, guruId) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO absensi (siswa_id, kelas_id, tanggal, status, guru_id)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        guru_id = VALUES(guru_id)
    `;

    db.query(query, [siswaId, kelasId, tanggal, status, guruId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};


export const verifySiswaInKelas = (siswaId, kelasId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 1
      FROM kelas_siswa ks
      JOIN tahun_ajaran ta ON ks.tahun_ajaran_id = ta.id
      WHERE ks.siswa_id = ?
        AND ks.kelas_id = ?
        AND ta.status = 'aktif'
      LIMIT 1
    `;

    db.query(query, [siswaId, kelasId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results.length > 0);
    });
  });
};


export const getRekapAbsensi = (kelasId, tanggalMulai, tanggalAkhir) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        s.id as siswa_id,
        s.nisn,
        s.nama_lengkap as nama_siswa,
        SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
        SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
        SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) as izin,
        SUM(CASE WHEN a.status = 'Alpha' THEN 1 ELSE 0 END) as alpha,
        COUNT(a.id) as total_kehadiran,
        (
          SELECT COUNT(DISTINCT tanggal) 
          FROM absensi 
          WHERE kelas_id = ? 
            AND tanggal BETWEEN ? AND ?
        ) as total_pertemuan
      FROM kelas_siswa ks
      JOIN siswa s ON ks.siswa_id = s.id
      JOIN tahun_ajaran ta ON ks.tahun_ajaran_id = ta.id
      LEFT JOIN absensi a ON s.id = a.siswa_id 
        AND a.kelas_id = ks.kelas_id
        AND a.tanggal BETWEEN ? AND ?
      WHERE ks.kelas_id = ?
        AND ta.status = 'aktif'
      GROUP BY s.id, s.nisn, s.nama_lengkap
      ORDER BY s.nama_lengkap ASC
    `;

    db.query(
      query,
      [kelasId, tanggalMulai, tanggalAkhir, tanggalMulai, tanggalAkhir, kelasId],
      (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results);
      }
    );
  });
};


export const getDateRangeFromTahunAjaran = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id as tahun_ajaran_id,
        tahun,
        semester,
        DATE_FORMAT(tanggal_mulai, '%Y-%m-%d') as tanggal_mulai,
        DATE_FORMAT(tanggal_selesai, '%Y-%m-%d') as tanggal_selesai
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

export default {
  getKelasWaliKelas,
  getSiswaWithAbsensi,
  verifyWaliKelas,
  getGuruRoleInKelas,
  getKelasByGuru,
  saveAbsensi,
  verifySiswaInKelas,
  getRekapAbsensi,
  getDateRangeFromTahunAjaran
};

