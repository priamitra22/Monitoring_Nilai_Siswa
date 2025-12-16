import db from '../../config/db.js'

export const getSiswaWithNilai = ({ kelas_id, tahun_ajaran_id, search }) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT DISTINCT
        s.id AS siswa_id,
        s.nama_lengkap,
        s.nisn,
        k.nama_kelas AS kelas,
        ta.tahun AS tahun_ajaran,
        ta.semester,
        COUNT(DISTINCT n.mapel_id) AS jumlah_mapel_dinilai
      FROM siswa s
      INNER JOIN nilai n ON s.id = n.siswa_id
      INNER JOIN kelas k ON n.kelas_id = k.id
      INNER JOIN tahun_ajaran ta ON n.tahun_ajaran_id = ta.id
      WHERE 1=1
    `

    const params = []

    if (tahun_ajaran_id) {
      query += ` AND n.tahun_ajaran_id = ?`
      params.push(tahun_ajaran_id)
    } else {
      query += ` AND ta.status = 'aktif'`
    }

    if (kelas_id) {
      query += ` AND n.kelas_id = ?`
      params.push(kelas_id)
    }

    if (search) {
      query += ` AND (s.nama_lengkap LIKE ? OR s.nisn LIKE ?)`
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern)
    }

    query += `
      GROUP BY s.id, s.nama_lengkap, s.nisn, k.nama_kelas, ta.tahun, ta.semester
      ORDER BY s.nama_lengkap ASC
    `

    db.query(query, params, (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results)
    })
  })
}

export const getSiswaInfoWithKelas = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        s.id AS siswa_id,
        s.nama_lengkap AS nama,
        s.nisn,
        s.tempat_lahir,
        s.tanggal_lahir,
        COALESCE(k.nama_kelas, '-') AS kelas,
        COALESCE(
          (SELECT o.nama_lengkap 
           FROM orangtua_siswa os 
           JOIN orangtua o ON os.orangtua_id = o.id 
           WHERE os.siswa_id = s.id 
           LIMIT 1),
          'Tidak Ada Data'
        ) AS nama_ortu,
        COALESCE(g.nama_lengkap, '-') AS wali_kelas_nama,
        COALESCE(g.nip, '-') AS wali_kelas_nip
      FROM siswa s
      LEFT JOIN kelas_siswa ks ON s.id = ks.siswa_id 
        AND ks.tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1)
      LEFT JOIN kelas k ON ks.kelas_id = k.id
      LEFT JOIN guru g ON k.wali_kelas_id = g.id
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

export const getNilaiPerSemesterWithId = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        ta.id AS tahun_ajaran_id,
        ta.tahun AS tahun_ajaran,
        ta.semester,
        k.nama_kelas AS kelas,
        m.id AS mapel_id,
        m.nama_mapel AS mapel,
        n.nilai_akhir,
        u.nama_lengkap AS guru_nama,
        CASE 
          WHEN n.nilai_akhir >= 85 THEN 'A'
          WHEN n.nilai_akhir >= 70 THEN 'B'
          WHEN n.nilai_akhir >= 55 THEN 'C'
          ELSE 'D'
        END AS grade
      FROM nilai n
      INNER JOIN tahun_ajaran ta ON n.tahun_ajaran_id = ta.id
      INNER JOIN kelas k ON n.kelas_id = k.id
      INNER JOIN mapel m ON n.mapel_id = m.id
      LEFT JOIN kelas_mapel km ON km.kelas_id = n.kelas_id 
        AND km.mapel_id = n.mapel_id 
        AND km.tahun_ajaran_id = n.tahun_ajaran_id
      LEFT JOIN guru g ON km.guru_id = g.id
      LEFT JOIN users u ON g.user_id = u.id
      WHERE n.siswa_id = ?
      ORDER BY ta.tahun DESC, ta.semester ASC, m.nama_mapel ASC
    `

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results)
    })
  })
}

export const getAbsensiPerSemester = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        ta.id AS tahun_ajaran_id,
        ta.semester,
        COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) AS hadir,
        COUNT(CASE WHEN a.status = 'Sakit' THEN 1 END) AS sakit,
        COUNT(CASE WHEN a.status = 'Izin' THEN 1 END) AS izin,
        COUNT(CASE WHEN a.status = 'Alpha' THEN 1 END) AS alpha
      FROM absensi a
      INNER JOIN kelas k ON a.kelas_id = k.id
      INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      WHERE a.siswa_id = ?
      GROUP BY ta.id, ta.semester
      ORDER BY ta.tahun DESC, ta.semester ASC
    `

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results)
    })
  })
}

export const getAllTahunAjaran = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id,
        tahun,
        semester,
        status
      FROM tahun_ajaran
      WHERE status = 'aktif'
      ORDER BY tahun DESC, 
        CASE WHEN semester = 'Ganjil' THEN 1 ELSE 2 END ASC
    `

    db.query(query, (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results)
    })
  })
}

export const getCatatanPerSemester = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        ta.id AS tahun_ajaran_id,
        ta.semester,
        ch.kategori,
        ch.jenis,
        cd.pesan,
        cd.created_at,
        u.nama_lengkap AS guru_nama,
        m.nama_mapel
      FROM catatan_header ch
      INNER JOIN catatan_detail cd ON ch.id = cd.header_id
      INNER JOIN kelas k ON ch.kelas_id = k.id
      INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      INNER JOIN guru g ON ch.guru_id = g.id
      INNER JOIN users u ON g.user_id = u.id
      LEFT JOIN mapel m ON ch.mapel_id = m.id
      WHERE ch.siswa_id = ?
      ORDER BY ta.tahun DESC, ta.semester ASC, cd.created_at ASC
    `

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results)
    })
  })
}


export const getKelasByTahunAjaran = (tahunAjaranId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT
        k.id,
        k.nama_kelas
      FROM kelas k
      WHERE k.tahun_ajaran_id = ?
      ORDER BY k.nama_kelas ASC
    `

    db.query(query, [tahunAjaranId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results)
    })
  })
}


export const getSiswaByKelasAndTahun = (kelasId, tahunAjaranId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT
        s.id,
        s.nama_lengkap AS nama,
        s.nisn
      FROM siswa s
      INNER JOIN kelas_siswa ks ON s.id = ks.siswa_id
      WHERE ks.kelas_id = ?
        AND ks.tahun_ajaran_id = ?
      ORDER BY s.nama_lengkap ASC
    `

    db.query(query, [kelasId, tahunAjaranId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results)
    })
  })
}


export const getAllSiswaIdsByKelas = (kelasId, tahunAjaranId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT
        s.id AS siswa_id
      FROM siswa s
      INNER JOIN kelas_siswa ks ON s.id = ks.siswa_id
      WHERE ks.kelas_id = ?
        AND ks.tahun_ajaran_id = ?
      ORDER BY s.nama_lengkap ASC
    `

    db.query(query, [kelasId, tahunAjaranId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results)
    })
  })
}


export const getKelasInfo = (kelasId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        k.id,
        k.nama_kelas,
        ta.tahun AS tahun_ajaran
      FROM kelas k
      INNER JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
      WHERE k.id = ?
      LIMIT 1
    `

    db.query(query, [kelasId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results[0] || null)
    })
  })
}

export default {
  getSiswaWithNilai,
  getSiswaInfoWithKelas,
  getNilaiPerSemesterWithId,
  getAbsensiPerSemester,
  getCatatanPerSemester,
  getAllTahunAjaran,
  getKelasByTahunAjaran,
  getSiswaByKelasAndTahun,
  getAllSiswaIdsByKelas,
  getKelasInfo,
}
