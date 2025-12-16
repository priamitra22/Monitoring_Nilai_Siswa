import db from '../../config/db.js'
export const getTahunAjaranBySiswa = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT
        ta.tahun
      FROM tahun_ajaran ta
      WHERE ta.status = 'aktif'
        OR EXISTS (
          SELECT 1
          FROM absensi a
          WHERE a.siswa_id = ?
            AND a.tanggal >= ta.tanggal_mulai
            AND a.tanggal <= ta.tanggal_selesai
        )
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

export const getSemesterByTahunAjaran = (siswaId, tahunAjaran) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        ta.id,
        ta.semester,
        ta.tanggal_mulai,
        ta.tanggal_selesai,
        COUNT(a.id) as has_data
      FROM tahun_ajaran ta
      LEFT JOIN absensi a ON (
        a.siswa_id = ?
        AND a.tanggal >= ta.tanggal_mulai
        AND a.tanggal <= ta.tanggal_selesai
      )
      WHERE ta.tahun = ?
      GROUP BY ta.id, ta.semester, ta.tanggal_mulai, ta.tanggal_selesai
      ORDER BY 
        CASE 
          WHEN ta.semester = 'Ganjil' THEN 1
          WHEN ta.semester = 'Genap' THEN 2
          ELSE 3
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

export const getSemesterInfo = (tahunAjaranId, semester) => {
  return new Promise((resolve, reject) => {
    const semesterEnum = semester === '1' ? 'Ganjil' : 'Genap'

    const query = `
      SELECT 
        id,
        semester,
        tanggal_mulai,
        tanggal_selesai
      FROM tahun_ajaran
      WHERE id = ?
        AND semester = ?
    `

    db.query(query, [tahunAjaranId, semesterEnum], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results[0] || null)
    })
  })
}

export const checkAbsensiByMonth = (siswaId, tahun, bulan) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COUNT(*) as count
      FROM absensi
      WHERE siswa_id = ?
        AND YEAR(tanggal) = ?
        AND MONTH(tanggal) = ?
    `

    db.query(query, [siswaId, tahun, bulan], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results[0].count)
    })
  })
}

export const getAbsensiSummaryBySemester = (siswaId, tanggalMulai, tanggalSelesai) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) as total_hadir,
        SUM(CASE WHEN status = 'Sakit' THEN 1 ELSE 0 END) as total_sakit,
        SUM(CASE WHEN status = 'Izin' THEN 1 ELSE 0 END) as total_izin,
        SUM(CASE WHEN status = 'Alpha' THEN 1 ELSE 0 END) as total_alpha,
        COUNT(*) as total_hari
      FROM absensi
      WHERE siswa_id = ?
        AND tanggal >= ?
        AND tanggal <= ?
    `

    db.query(query, [siswaId, tanggalMulai, tanggalSelesai], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results[0] || {})
    })
  })
}

export const getTahunAjaranInfo = (tahunAjaranId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT tahun
      FROM tahun_ajaran
      WHERE id = ?
    `

    db.query(query, [tahunAjaranId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results[0] || null)
    })
  })
}

export const getDetailAbsensi = (siswaId, tanggalMulai, tanggalSelesai, bulan = null) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        a.id,
        a.tanggal,
        a.status,
        a.guru_id,
        g.nama_lengkap as guru_nama,
        a.kelas_id,
        k.nama_kelas as kelas_nama
      FROM absensi a
      LEFT JOIN guru g ON a.guru_id = g.id
      LEFT JOIN kelas k ON a.kelas_id = k.id
      WHERE a.siswa_id = ?
        AND a.tanggal >= ?
        AND a.tanggal <= ?
    `

    const params = [siswaId, tanggalMulai, tanggalSelesai]
    if (bulan) {
      query += ` AND MONTH(a.tanggal) = ?`
      params.push(parseInt(bulan))
    }

    query += ` ORDER BY a.tanggal DESC`

    db.query(query, params, (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results)
    })
  })
}

export default {
  getTahunAjaranBySiswa,
  getSemesterByTahunAjaran,
  getSemesterInfo,
  checkAbsensiByMonth,
  getAbsensiSummaryBySemester,
  getTahunAjaranInfo,
  getDetailAbsensi,
}
