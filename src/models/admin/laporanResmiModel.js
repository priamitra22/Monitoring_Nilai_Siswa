import db from '../../config/db.js'

export const getAllLaporanResmi = (
  page = 1,
  limit = 10,
  search = '',
  tahunAjaranId = '',
  kelasId = '',
  semester = '',
  sortBy = 'upload_date',
  sortOrder = 'desc'
) => {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit

    let query = `
      SELECT 
        lr.id,
        lr.siswa_id,
        s.nisn,
        s.nama_lengkap as nama_siswa,
        lr.kelas_id,
        k.nama_kelas,
        lr.tahun_ajaran_id,
        ta.tahun as tahun_ajaran,
        lr.semester,
        lr.file_path,
        lr.original_filename,
        lr.file_size,
        lr.version,
        lr.is_latest,
        lr.uploaded_by,
        u.nama_lengkap as uploaded_by_name,
        lr.upload_date,
        lr.keterangan
      FROM laporan_resmi lr
      INNER JOIN siswa s ON lr.siswa_id = s.id
      INNER JOIN kelas k ON lr.kelas_id = k.id
      INNER JOIN tahun_ajaran ta ON lr.tahun_ajaran_id = ta.id
      INNER JOIN users u ON lr.uploaded_by = u.id
      WHERE lr.is_latest = TRUE
    `

    let countQuery = `
      SELECT COUNT(*) as total
      FROM laporan_resmi lr
      INNER JOIN siswa s ON lr.siswa_id = s.id
      INNER JOIN kelas k ON lr.kelas_id = k.id
      INNER JOIN tahun_ajaran ta ON lr.tahun_ajaran_id = ta.id
      WHERE lr.is_latest = TRUE
    `

    const params = []
    const countParams = []

    if (search) {
      const searchPattern = `%${search}%`
      query += ` AND (s.nisn LIKE ? OR s.nama_lengkap LIKE ?)`
      countQuery += ` AND (s.nisn LIKE ? OR s.nama_lengkap LIKE ?)`
      params.push(searchPattern, searchPattern)
      countParams.push(searchPattern, searchPattern)
    }
    if (kelasId) {
      query += ` AND lr.siswa_id IN (
        SELECT siswa_id FROM kelas_siswa WHERE kelas_id = ?
      )`
      countQuery += ` AND lr.siswa_id IN (
        SELECT siswa_id FROM kelas_siswa WHERE kelas_id = ?
      )`
      params.push(kelasId)
      countParams.push(kelasId)
    }

    const validSortColumns = [
      'nisn',
      'nama_siswa',
      'nama_kelas',
      'tahun_ajaran',
      'semester',
      'version',
      'upload_date',
    ]
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'upload_date'
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

    query += ` ORDER BY ${sortColumn} ${order}`

    query += ` LIMIT ? OFFSET ?`
    params.push(limit, offset)

    db.query(countQuery, countParams, (error, countResults) => {
      if (error) {
        return reject(error)
      }

      const total = countResults[0].total

      if (total === 0) {
        return resolve({
          data: [],
          pagination: {
            current_page: page,
            per_page: limit,
            total_data: 0,
            total_pages: 0,
            has_next: false,
            has_prev: false,
          },
        })
      }

      db.query(query, params, (error, results) => {
        if (error) {
          return reject(error)
        }

        const totalPages = Math.ceil(total / limit)

        resolve({
          data: results,
          pagination: {
            current_page: page,
            per_page: limit,
            total_data: total,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1,
          },
        })
      })
    })
  })
}

export const getLaporanResmiStatistics = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        COUNT(*) as total_laporan,
        COUNT(DISTINCT siswa_id) as total_siswa_ada_laporan
      FROM laporan_resmi
      WHERE is_latest = TRUE
    `

    db.query(query, (error, results) => {
      if (error) {
        return reject(error)
      }

      resolve({
        total_laporan: results[0].total_laporan || 0,
        total_siswa_ada_laporan: results[0].total_siswa_ada_laporan || 0,
      })
    })
  })
}

export const getLaporanResmiById = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        lr.id,
        lr.siswa_id,
        s.nisn,
        s.nama_lengkap as nama_siswa,
        lr.kelas_id,
        k.nama_kelas,
        lr.tahun_ajaran_id,
        ta.tahun as tahun_ajaran,
        lr.semester,
        lr.file_path,
        lr.original_filename,
        lr.file_size,
        lr.version,
        lr.is_latest,
        lr.uploaded_by,
        u.nama_lengkap as uploaded_by_name,
        lr.upload_date,
        lr.keterangan
      FROM laporan_resmi lr
      INNER JOIN siswa s ON lr.siswa_id = s.id
      INNER JOIN kelas k ON lr.kelas_id = k.id
      INNER JOIN tahun_ajaran ta ON lr.tahun_ajaran_id = ta.id
      INNER JOIN users u ON lr.uploaded_by = u.id
      WHERE lr.id = ?
    `

    db.query(query, [id], (error, results) => {
      if (error) {
        return reject(error)
      }

      if (results.length === 0) {
        return resolve(null)
      }

      resolve(results[0])
    })
  })
}

export const getVersionHistory = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        lr.id,
        lr.version,
        lr.kelas_id,
        k.nama_kelas,
        lr.tahun_ajaran_id,
        ta.tahun as tahun_ajaran,
        lr.semester,
        lr.file_path,
        lr.file_size,
        lr.is_latest,
        lr.upload_date,
        u.nama_lengkap as uploaded_by_name,
        lr.keterangan
      FROM laporan_resmi lr
      INNER JOIN users u ON lr.uploaded_by = u.id
      INNER JOIN kelas k ON lr.kelas_id = k.id
      INNER JOIN tahun_ajaran ta ON lr.tahun_ajaran_id = ta.id
      WHERE lr.siswa_id = ?
      ORDER BY lr.version DESC
    `

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error)
      }

      resolve(results)
    })
  })
}


export const checkExistingLaporan = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, version, is_latest
      FROM laporan_resmi
      WHERE siswa_id = ?
        AND is_latest = TRUE
    `

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error)
      }

      resolve(results.length > 0 ? results[0] : null)
    })
  })
}


export const getLatestVersion = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT MAX(version) as latest_version
      FROM laporan_resmi
      WHERE siswa_id = ?
    `

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error)
      }

      const latestVersion = results[0].latest_version || 0
      resolve(latestVersion)
    })
  })
}


export const setOldVersionNotLatest = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE laporan_resmi
      SET is_latest = FALSE
      WHERE siswa_id = ?
        AND is_latest = TRUE
    `

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error)
      }

      resolve(results)
    })
  })
}


export const createLaporanResmi = (data) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO laporan_resmi (
        siswa_id,
        kelas_id,
        tahun_ajaran_id,
        semester,
        file_path,
        original_filename,
        file_size,
        version,
        is_latest,
        uploaded_by,
        keterangan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const params = [
      data.siswa_id,
      data.kelas_id,
      data.tahun_ajaran_id,
      data.semester,
      data.file_path,
      data.original_filename,
      data.file_size,
      data.version,
      data.is_latest !== undefined ? data.is_latest : true,
      data.uploaded_by,
      data.keterangan || null,
    ]

    db.query(query, params, (error, results) => {
      if (error) {
        return reject(error)
      }

      resolve({
        id: results.insertId,
        ...data,
      })
    })
  })
}


export const updateLaporanResmi = (id, keterangan) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE laporan_resmi
      SET keterangan = ?
      WHERE id = ?
    `

    db.query(query, [keterangan, id], (error, results) => {
      if (error) {
        return reject(error)
      }

      if (results.affectedRows === 0) {
        return resolve(null)
      }

      resolve(results)
    })
  })
}

export const deleteLaporanResmi = (id) => {
  return new Promise((resolve, reject) => {
    const selectQuery = `
      SELECT siswa_id, tahun_ajaran_id, semester, version, is_latest, file_path
      FROM laporan_resmi
      WHERE id = ?
    `

    db.query(selectQuery, [id], (error, results) => {
      if (error) {
        return reject(error)
      }

      if (results.length === 0) {
        return resolve(null)
      }

      const laporan = results[0]

      const deleteQuery = `DELETE FROM laporan_resmi WHERE id = ?`

      db.query(deleteQuery, [id], (error, deleteResults) => {
        if (error) {
          return reject(error)
        }

        resolve({
          deletedLaporan: laporan,
          affectedRows: deleteResults.affectedRows,
        })
      })
    })
  })
}

export const setPreviousVersionAsLatest = (siswaId, deletedVersion) => {
  return new Promise((resolve, reject) => {
    const findQuery = `
      SELECT id, version
      FROM laporan_resmi
      WHERE siswa_id = ?
        AND version < ?
      ORDER BY version DESC
      LIMIT 1
    `

    db.query(findQuery, [siswaId, deletedVersion], (error, results) => {
      if (error) {
        return reject(error)
      }

      if (results.length === 0) {
        return resolve({ affectedRows: 0 })
      }

      const previousVersion = results[0].version

      const updateQuery = `
        UPDATE laporan_resmi
        SET is_latest = TRUE
        WHERE siswa_id = ?
          AND version = ?
      `

      db.query(updateQuery, [siswaId, previousVersion], (error, updateResults) => {
        if (error) {
          return reject(error)
        }

        resolve(updateResults)
      })
    })
  })
}


export const validateSiswaInKelas = (siswaId, kelasId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT ks.id
      FROM kelas_siswa ks
      WHERE ks.siswa_id = ? AND ks.kelas_id = ?
    `

    db.query(query, [siswaId, kelasId], (error, results) => {
      if (error) {
        return reject(error)
      }

      resolve(results.length > 0)
    })
  })
}


export const getSiswaNameById = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT nama_lengkap FROM siswa WHERE id = ?`

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error)
      }

      if (results.length === 0) {
        return resolve(null)
      }

      resolve(results[0].nama_lengkap)
    })
  })
}
