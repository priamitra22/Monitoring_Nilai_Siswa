import db from '../../config/db.js'

export const getTahunAjaranListBySiswa = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT
        ta.tahun AS tahun_ajaran,
        MAX(CASE WHEN ta.status = 'aktif' THEN 1 ELSE 0 END) AS is_active
      FROM tahun_ajaran ta
      JOIN kelas_siswa ks ON ta.id = ks.tahun_ajaran_id
      WHERE ks.siswa_id = ?
      GROUP BY ta.tahun
      ORDER BY ta.tahun DESC
    `

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results)
    })
  })
}

export const getSemesterListBySiswa = (siswaId, tahunAjaran) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT
        ta.id AS tahun_ajaran_id,
        n.semester,
        CASE 
          WHEN n.semester = 'Ganjil' THEN 'Semester 1 (Ganjil)'
          WHEN n.semester = 'Genap' THEN 'Semester 2 (Genap)'
        END AS label
      FROM nilai n
      JOIN tahun_ajaran ta ON n.tahun_ajaran_id = ta.id
      WHERE n.siswa_id = ?
        AND ta.tahun = ?
      ORDER BY 
        CASE 
          WHEN n.semester = 'Ganjil' THEN 1
          WHEN n.semester = 'Genap' THEN 2
        END ASC
    `

    db.query(query, [siswaId, tahunAjaran], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results)
    })
  })
}

export const getNilaiBySiswaId = (siswaId, tahunAjaranId, semester) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        -- Siswa Info
        s.id AS siswa_id,
        s.nama_lengkap AS siswa_nama,
        s.nisn,
        k.nama_kelas AS kelas_nama,
        
        -- Nilai Info
        n.id AS nilai_id,
        m.nama_mapel,
        
        -- All nilai components for calculation (might be NULL)
        n.lm1_tp1, n.lm1_tp2, n.lm1_tp3, n.lm1_tp4,
        n.lm2_tp1, n.lm2_tp2, n.lm2_tp3, n.lm2_tp4,
        n.lm3_tp1, n.lm3_tp2, n.lm3_tp3, n.lm3_tp4,
        n.lm4_tp1, n.lm4_tp2, n.lm4_tp3, n.lm4_tp4,
        n.lm5_tp1, n.lm5_tp2, n.lm5_tp3, n.lm5_tp4,
        n.lm1_ulangan, n.lm2_ulangan, n.lm3_ulangan, n.lm4_ulangan, n.lm5_ulangan,
        n.uts, n.uas,
        n.nilai_akhir,
        
        -- Guru Info (from kelas_mapel relationship)
        u.nama_lengkap AS guru_nama,
        
        -- Metadata
        ta.tahun AS tahun_ajaran,
        ? AS semester
        
      FROM siswa s
      JOIN kelas_siswa ks ON s.id = ks.siswa_id
      JOIN kelas k ON ks.kelas_id = k.id
      JOIN tahun_ajaran ta ON ta.id = ?
      
      -- Join to kelas_mapel to get ALL mapel in the class
      JOIN kelas_mapel km ON (
        km.kelas_id = ks.kelas_id
        AND km.tahun_ajaran_id = ?
      )
      JOIN mapel m ON km.mapel_id = m.id
      
      -- LEFT JOIN nilai (might be NULL if no grades yet)
      LEFT JOIN nilai n ON (
        n.siswa_id = s.id
        AND n.kelas_id = ks.kelas_id
        AND n.mapel_id = km.mapel_id
        AND n.tahun_ajaran_id = ?
        AND n.semester = ?
      )
      
      -- Guru info
      LEFT JOIN guru g ON km.guru_id = g.id
      LEFT JOIN users u ON g.user_id = u.id
      
      WHERE s.id = ?
        AND ks.tahun_ajaran_id = ?
      
      ORDER BY m.nama_mapel ASC
    `

    db.query(
      query,
      [semester, tahunAjaranId, tahunAjaranId, tahunAjaranId, semester, siswaId, tahunAjaranId],
      (error, results) => {
        if (error) {
          return reject(error)
        }
        resolve(results)
      }
    )
  })
}

export const getStatistikNilai = (siswaId, tahunAjaranId, semester) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        COUNT(*) AS total_mapel,
        COUNT(CASE WHEN n.nilai_akhir IS NOT NULL THEN 1 END) AS mapel_dengan_nilai,
        AVG(n.nilai_akhir) AS rata_rata,
        MAX(n.nilai_akhir) AS nilai_tertinggi,
        MIN(n.nilai_akhir) AS nilai_terendah,
        COUNT(CASE WHEN n.nilai_akhir >= 75 THEN 1 END) AS tuntas,
        COUNT(CASE WHEN n.nilai_akhir < 75 AND n.nilai_akhir IS NOT NULL THEN 1 END) AS belum_tuntas
      FROM siswa s
      JOIN kelas_siswa ks ON s.id = ks.siswa_id
      LEFT JOIN nilai n ON (
        s.id = n.siswa_id 
        AND n.tahun_ajaran_id = ?
        AND n.semester = ?
      )
      WHERE s.id = ?
        AND ks.tahun_ajaran_id = ?
    `

    db.query(query, [tahunAjaranId, semester, siswaId, tahunAjaranId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results[0] || null)
    })
  })
}

export const getGuruWaliKelasBySiswa = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        u.nama_lengkap AS nama,
        g.nip
      FROM siswa s
      JOIN kelas_siswa ks ON s.id = ks.siswa_id
      JOIN kelas k ON ks.kelas_id = k.id
      JOIN guru g ON k.wali_kelas_id = g.id
      JOIN users u ON g.user_id = u.id
      WHERE s.id = ?
      LIMIT 1
    `

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results[0] || null)
    })
  })
}

export const getCatatanPerkembanganBySiswa = (siswaId, tahunAjaranId, semester) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        ch.id,
        ch.created_at AS tanggal,
        (
          SELECT cd.pesan 
          FROM catatan_detail cd 
          WHERE cd.header_id = ch.id 
          ORDER BY cd.created_at ASC 
          LIMIT 1
        ) AS isi_catatan,
        u.nama_lengkap AS guru_nama,
        ch.kategori,
        ch.jenis
      FROM catatan_header ch
      JOIN guru g ON ch.guru_id = g.id
      JOIN users u ON g.user_id = u.id
      WHERE ch.siswa_id = ?
      ORDER BY ch.created_at DESC
    `

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results)
    })
  })
}

export const getRekapAbsensiBySiswa = (siswaId, tahunAjaranId, semester) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        COUNT(CASE WHEN status = 'Hadir' THEN 1 END) AS hadir,
        COUNT(CASE WHEN status = 'Sakit' THEN 1 END) AS sakit,
        COUNT(CASE WHEN status = 'Izin' THEN 1 END) AS izin,
        COUNT(CASE WHEN status = 'Alpha' THEN 1 END) AS alpha
      FROM absensi
      WHERE siswa_id = ?
        AND kelas_id = (
          SELECT ks.kelas_id 
          FROM kelas_siswa ks 
          WHERE ks.siswa_id = ? 
            AND ks.tahun_ajaran_id = ?
          LIMIT 1
        )
    `

    db.query(query, [siswaId, siswaId, tahunAjaranId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results[0] || { hadir: 0, sakit: 0, izin: 0, alpha: 0 })
    })
  })
}

export default {
  getTahunAjaranListBySiswa,
  getSemesterListBySiswa,
  getNilaiBySiswaId,
  getStatistikNilai,
  getGuruWaliKelasBySiswa,
  getCatatanPerkembanganBySiswa,
  getRekapAbsensiBySiswa,
}
