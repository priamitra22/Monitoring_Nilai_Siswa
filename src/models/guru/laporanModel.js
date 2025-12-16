import db from '../../config/db.js';

export const getKelasWali = (guruId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        k.id AS kelas_id,
        k.nama_kelas,
        ta.tahun AS tahun_ajaran,
        ta.semester
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

export const checkIsWaliKelas = (guruId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COUNT(*) AS count
      FROM kelas k
      WHERE k.wali_kelas_id = ?
        AND k.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
    `;

    db.query(query, [guruId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0].count > 0);
    });
  });
};

export const checkIsWaliKelasOfKelas = (guruId, kelasId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COUNT(*) AS count
      FROM kelas k
      WHERE k.id = ?
        AND k.wali_kelas_id = ?
        AND k.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
    `;

    db.query(query, [kelasId, guruId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0].count > 0);
    });
  });
};

export const getSiswaByKelas = (kelasId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        s.id AS siswa_id,
        s.nama_lengkap AS nama,
        s.nisn
      FROM siswa s
      JOIN kelas_siswa ks ON s.id = ks.siswa_id
      WHERE ks.kelas_id = ?
        AND ks.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
      ORDER BY s.nama_lengkap ASC
    `;

    db.query(query, [kelasId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

export const checkIsWaliKelasOfSiswa = (guruId, siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT k.id AS kelas_id 
      FROM kelas k
      JOIN kelas_siswa ks ON k.id = ks.kelas_id
      WHERE k.wali_kelas_id = ? 
        AND ks.siswa_id = ?
        AND k.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
        AND ks.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
      LIMIT 1
    `;

    db.query(query, [guruId, siswaId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0] || null);
    });
  });
};

export const getSiswaDetail = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        s.id AS siswa_id,
        s.nama_lengkap AS nama,
        s.nisn,
        k.nama_kelas AS kelas,
        COALESCE(
          (SELECT o.nama_lengkap 
           FROM orangtua_siswa os 
           JOIN orangtua o ON os.orangtua_id = o.id 
           WHERE os.siswa_id = s.id 
           LIMIT 1),
          'Tidak Ada Data'
        ) AS nama_ortu
      FROM siswa s
      JOIN kelas_siswa ks ON s.id = ks.siswa_id
      JOIN kelas k ON ks.kelas_id = k.id
      WHERE s.id = ?
        AND ks.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
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

export const getNilaiAkademikSiswa = (siswaId, kelasId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        m.id AS mapel_id,
        m.nama_mapel,
        n.nilai_akhir,
        CASE 
          WHEN n.nilai_akhir >= 85 THEN 'A'
          WHEN n.nilai_akhir >= 70 THEN 'B'
          WHEN n.nilai_akhir >= 55 THEN 'C'
          ELSE 'D'
        END AS grade
      FROM kelas_mapel km
      JOIN mapel m ON km.mapel_id = m.id
      LEFT JOIN nilai n ON (
        n.siswa_id = ? 
        AND n.kelas_id = km.kelas_id 
        AND n.mapel_id = km.mapel_id
        AND n.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
        AND n.semester = (SELECT semester FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
      )
      WHERE km.kelas_id = ?
        AND km.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
      ORDER BY m.nama_mapel ASC
    `;

    db.query(query, [siswaId, kelasId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

export const getRekapAbsensiSiswa = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) AS hadir,
        COUNT(CASE WHEN a.status = 'Sakit' THEN 1 END) AS sakit,
        COUNT(CASE WHEN a.status = 'Izin' THEN 1 END) AS izin,
        COUNT(CASE WHEN a.status = 'Alpha' THEN 1 END) AS alpha
      FROM absensi a
      WHERE a.siswa_id = ? 
        AND a.kelas_id = (
          SELECT ks.kelas_id 
          FROM kelas_siswa ks 
          WHERE ks.siswa_id = ? 
            AND ks.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
          LIMIT 1
        )
    `;

    db.query(query, [siswaId, siswaId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0] || { hadir: 0, sakit: 0, izin: 0, alpha: 0 });
    });
  });
};

export const getCatatanPerkembanganSiswa = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        ch.id AS catatan_id,
        g.nama_lengkap AS guru_nama,
        COALESCE(m.nama_mapel, 'Umum') AS mapel_nama,
        ch.kategori,
        ch.jenis,
        DATE_FORMAT(ch.created_at, '%d/%m/%Y') AS tanggal,
        (SELECT cd_first.pesan 
         FROM catatan_detail cd_first 
         WHERE cd_first.header_id = ch.id 
         ORDER BY cd_first.created_at ASC 
         LIMIT 1) AS isi_catatan
      FROM catatan_header ch
      JOIN guru g ON ch.guru_id = g.id
      LEFT JOIN mapel m ON ch.mapel_id = m.id
      WHERE ch.siswa_id = ? 
        AND ch.kelas_id IN (
          SELECT ks.kelas_id 
          FROM kelas_siswa ks 
          WHERE ks.siswa_id = ? 
            AND ks.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
        )
      ORDER BY ch.created_at DESC
      LIMIT 10
    `;

    db.query(query, [siswaId, siswaId], (error, results) => {
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
      SELECT id, tahun, semester
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

export const checkGuruMengampuMapelDiKelas = (guruId, kelasId, mapelId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COUNT(*) AS count
      FROM kelas_mapel km
      WHERE km.guru_id = ?
        AND km.kelas_id = ?
        AND km.mapel_id = ?
        AND km.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
    `;

    db.query(query, [guruId, kelasId, mapelId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0].count > 0);
    });
  });
};

export const getRekapNilaiSiswa = (kelasId, mapelId, tahunAjaranId, semester) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        s.id AS siswa_id,
        s.nama_lengkap AS nama,
        s.nisn,
        n.lm1_tp1, n.lm1_tp2, n.lm1_tp3, n.lm1_tp4,
        n.lm2_tp1, n.lm2_tp2, n.lm2_tp3, n.lm2_tp4,
        n.lm3_tp1, n.lm3_tp2, n.lm3_tp3, n.lm3_tp4,
        n.lm4_tp1, n.lm4_tp2, n.lm4_tp3, n.lm4_tp4,
        n.lm5_tp1, n.lm5_tp2, n.lm5_tp3, n.lm5_tp4,
        n.lm1_ulangan, n.lm2_ulangan, n.lm3_ulangan, n.lm4_ulangan, n.lm5_ulangan,
        n.uts, n.uas,
        n.nilai_akhir,
        n.id AS nilai_id,
        n.kelas_id AS nilai_kelas_id,
        n.mapel_id AS nilai_mapel_id,
        n.tahun_ajaran_id AS nilai_ta_id,
        n.semester AS nilai_semester
      FROM siswa s
      JOIN kelas_siswa ks ON s.id = ks.siswa_id
      LEFT JOIN nilai n ON (
        s.id = n.siswa_id 
        AND n.kelas_id = ?
        AND n.mapel_id = ?
        AND n.tahun_ajaran_id = ?
        AND n.semester = ?
      )
      WHERE ks.kelas_id = ?
        AND ks.tahun_ajaran_id = ?
      ORDER BY s.nama_lengkap ASC
    `;

    db.query(
      query,
      [kelasId, mapelId, tahunAjaranId, semester, kelasId, tahunAjaranId],
      (error, results) => {
        if (error) {
          return reject(error);
        }

        if (results.length > 0) {
        }

        resolve(results);
      }
    );
  });
};


export const getKelasById = (kelasId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, nama_kelas
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
      SELECT id, nama_mapel
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

export const getGuruById = (guruId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        g.id,
        g.nip,
        g.nama_lengkap
      FROM guru g
      WHERE g.id = ?
    `;

    db.query(query, [guruId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results[0] || null);
    });
  });
};

export default {
  getKelasWali,
  checkIsWaliKelas,
  checkIsWaliKelasOfKelas,
  getSiswaByKelas,
  checkIsWaliKelasOfSiswa,
  getSiswaDetail,
  getNilaiAkademikSiswa,
  getRekapAbsensiSiswa,
  getCatatanPerkembanganSiswa,
  getTahunAjaranAktif,
  checkGuruMengampuMapelDiKelas,
  getRekapNilaiSiswa,
  getKelasById,
  getMapelById,
  getGuruById
};

