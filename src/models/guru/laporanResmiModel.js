import db from '../../config/db.js'

export const getLaporanByGuru = (guruId, kelasId, page, limit, search) => {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit

    let query = `
      SELECT DISTINCT
        lr.id,
        lr.siswa_id,
        s.nisn,
        s.nama_lengkap as nama_siswa,
        lr.kelas_id,
        k.nama_kelas,
        lr.tahun_ajaran_id,
        ta.tahun as tahun_ajaran,
        lr.semester,
        lr.version,
        lr.upload_date,
        lr.file_size,
        u.nama_lengkap as uploaded_by_name
      FROM laporan_resmi lr
      INNER JOIN siswa s ON lr.siswa_id = s.id
      INNER JOIN kelas k ON lr.kelas_id = k.id
      INNER JOIN tahun_ajaran ta ON lr.tahun_ajaran_id = ta.id
      INNER JOIN users u ON lr.uploaded_by = u.id
      WHERE lr.is_latest = TRUE
        AND lr.siswa_id IN (
          SELECT ks.siswa_id 
          FROM kelas_siswa ks
          INNER JOIN kelas_mapel km ON ks.kelas_id = km.kelas_id
          WHERE km.guru_id = ?
            AND ks.kelas_id = ?
        )
    `

    const params = [guruId, kelasId]
    let countQuery = query

    if (search) {
      const searchPattern = `%${search}%`
      query += ` AND (s.nisn LIKE ? OR s.nama_lengkap LIKE ?)`
      countQuery += ` AND (s.nisn LIKE ? OR s.nama_lengkap LIKE ?)`
      params.push(searchPattern, searchPattern)
    }

    db.query(countQuery, params, (error, countResults) => {
      if (error) return reject(error)

      const total = countResults.length

      query += ` ORDER BY lr.upload_date DESC LIMIT ? OFFSET ?`
      params.push(limit, offset)

      db.query(query, params, (error, results) => {
        if (error) return reject(error)

        resolve({
          data: results,
          pagination: {
            current_page: page,
            per_page: limit,
            total_data: total,
            total_pages: Math.ceil(total / limit),
          },
        })
      })
    })
  })
}

export const getKelasByGuru = (guruId, tahunAjaranId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT k.id, k.nama_kelas
      FROM kelas k
      INNER JOIN kelas_mapel km ON k.id = km.kelas_id
      WHERE km.guru_id = ?
        AND km.tahun_ajaran_id = ?
      ORDER BY k.nama_kelas
    `

    db.query(query, [guruId, tahunAjaranId], (error, results) => {
      if (error) return reject(error)
      resolve(results)
    })
  })
}

export const getLaporanById = (id, guruId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT lr.*
      FROM laporan_resmi lr
      INNER JOIN kelas k ON lr.kelas_id = k.id
      INNER JOIN kelas_mapel km ON k.id = km.kelas_id
      WHERE lr.id = ?
        AND km.guru_id = ?
    `

    db.query(query, [id, guruId], (error, results) => {
      if (error) return reject(error)
      resolve(results.length > 0 ? results[0] : null)
    })
  })
}

export const getVersionHistory = (siswaId, guruId) => {
  return new Promise((resolve, reject) => {
    const verifyQuery = `
      SELECT 1
      FROM kelas_siswa ks
      INNER JOIN kelas_mapel km ON ks.kelas_id = km.kelas_id
      WHERE ks.siswa_id = ?
        AND km.guru_id = ?
    `

    db.query(verifyQuery, [siswaId, guruId], (error, verifyResults) => {
      if (error) return reject(error)
      if (verifyResults.length === 0) {
        return reject(new Error('Unauthorized: Siswa not in your class'))
      }

      const query = `
        SELECT 
          lr.id,
          lr.version,
          lr.kelas_id,
          k.nama_kelas,
          lr.tahun_ajaran_id,
          ta.tahun as tahun_ajaran,
          lr.semester,
          lr.file_size,
          lr.is_latest,
          lr.upload_date,
          u.nama_lengkap as uploaded_by_name
        FROM laporan_resmi lr
        INNER JOIN kelas k ON lr.kelas_id = k.id
        INNER JOIN tahun_ajaran ta ON lr.tahun_ajaran_id = ta.id
        INNER JOIN users u ON lr.uploaded_by = u.id
        WHERE lr.siswa_id = ?
        ORDER BY lr.version DESC
      `

      db.query(query, [siswaId], (error, results) => {
        if (error) return reject(error)
        resolve(results)
      })
    })
  })
}
