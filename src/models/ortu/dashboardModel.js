import db from '../../config/db.js';

export const getProfileAnak = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        s.id,
        s.nama_lengkap AS nama,
        s.nisn,
        k.nama_kelas AS kelas,
        ta.tahun AS tahun_ajaran,
        ta.semester
      FROM siswa s
      INNER JOIN kelas_siswa ks ON s.id = ks.siswa_id
      INNER JOIN tahun_ajaran ta ON ks.tahun_ajaran_id = ta.id AND ta.status = 'aktif'
      LEFT JOIN kelas k ON ks.kelas_id = k.id
      WHERE s.id = ?
      LIMIT 1
    `;


    db.query(query, [siswaId], (error, results) => {
      if (error) {
        console.error('   ❌ Query error:', error);
        return reject(error);
      }


      if (!results || results.length === 0) {
        return reject(new Error('Data siswa tidak ditemukan'));
      }

      resolve(results[0]);
    });
  });
};

export const getNilaiRataRata = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        AVG(n.nilai_akhir) AS nilai_rata_rata
      FROM nilai n
      WHERE n.siswa_id = ?
        AND n.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
        AND n.nilai_akhir > 0
    `;

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error);
      }

      if (!results || results.length === 0 || !results[0].nilai_rata_rata) {
        return resolve(null);
      }

      resolve(parseFloat(results[0].nilai_rata_rata));
    });
  });
};

export const getAbsensiHariIni = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        a.status,
        a.tanggal,
        k.nama_kelas AS kelas
      FROM absensi a
      INNER JOIN kelas k ON a.kelas_id = k.id
      WHERE a.siswa_id = ?
        AND a.tanggal = CURDATE()
      LIMIT 1
    `;

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error);
      }

      if (!results || results.length === 0) {
        return resolve(null);
      }

      resolve(results[0]);
    });
  });
};

export const getKelasSiswa = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT k.nama_kelas
      FROM kelas_siswa ks
      INNER JOIN kelas k ON ks.kelas_id = k.id
      INNER JOIN tahun_ajaran ta ON ks.tahun_ajaran_id = ta.id
      WHERE ks.siswa_id = ?
        AND ta.status = 'aktif'
      LIMIT 1
    `;

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error);
      }

      if (!results || results.length === 0) {
        return resolve(null);
      }

      resolve(results[0].nama_kelas);
    });
  });
};

export const getCatatanTerbaru = (siswaId, limit = 5) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        ch.id,
        g.nama_lengkap AS guru_nama,
        m.nama_mapel AS mata_pelajaran,
        cd.pesan AS catatan,
        ch.created_at
      FROM catatan_header ch
      INNER JOIN guru g ON ch.guru_id = g.id
      LEFT JOIN mapel m ON ch.mapel_id = m.id
      INNER JOIN catatan_detail cd ON ch.id = cd.header_id
      WHERE ch.siswa_id = ?
        AND cd.id = (
          SELECT MIN(id) 
          FROM catatan_detail 
          WHERE header_id = ch.id
        )
      ORDER BY ch.created_at DESC
      LIMIT ?
    `;

    db.query(query, [siswaId, limit], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results || []);
    });
  });
};

export const getNilaiPerMapel = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        m.nama_mapel,
        ta.tahun,
        ta.semester,
        n.nilai_akhir
      FROM nilai n
      INNER JOIN mapel m ON n.mapel_id = m.id
      INNER JOIN tahun_ajaran ta ON n.tahun_ajaran_id = ta.id
      WHERE n.siswa_id = ?
        AND ta.status = 'aktif'
        AND n.nilai_akhir > 0
      ORDER BY n.nilai_akhir ASC
    `;

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results || []);
    });
  });
};

export default {
  getProfileAnak,
  getNilaiRataRata,
  getAbsensiHariIni,
  getKelasSiswa,
  getCatatanTerbaru,
  getNilaiPerMapel
};

