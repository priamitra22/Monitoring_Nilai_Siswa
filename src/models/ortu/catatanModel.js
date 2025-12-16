import db from '../../config/db.js'
export const getStatistikBySiswa = (siswaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN kategori = 'Positif' THEN 1 ELSE 0 END) as positif,
        SUM(CASE WHEN kategori = 'Negatif' THEN 1 ELSE 0 END) as negatif,
        SUM(CASE WHEN kategori = 'Netral' THEN 1 ELSE 0 END) as netral
      FROM catatan_header
      WHERE siswa_id = ?
    `

    db.query(query, [siswaId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results[0] || { total: 0, positif: 0, negatif: 0, netral: 0 })
    })
  })
}

export const getCatatanList = (siswaId, filters) => {
  return new Promise((resolve, reject) => {
    const {
      page = 1,
      per_page = 10,
      search = '',
      kategori = '',
      jenis = '',
      sort_by = 'tanggal',
      sort_order = 'desc',
    } = filters

    const limit = parseInt(per_page)
    const offset = (parseInt(page) - 1) * limit

    let whereConditions = ['ch.siswa_id = ?']
    let queryParams = [siswaId]

    if (search) {
      whereConditions.push(
        '(g.nama_lengkap LIKE ? OR EXISTS (SELECT 1 FROM catatan_detail cd WHERE cd.header_id = ch.id AND cd.pesan LIKE ? LIMIT 1))'
      )
      queryParams.push(`%${search}%`, `%${search}%`)
    }

    if (kategori) {
      whereConditions.push('ch.kategori = ?')
      queryParams.push(kategori)
    }
    if (jenis) {
      whereConditions.push('ch.jenis = ?')
      queryParams.push(jenis)
    }

    const whereClause = whereConditions.join(' AND ')

    const sortColumns = {
      tanggal: 'ch.created_at',
      guru_nama: 'g.nama_lengkap',
      kategori: 'ch.kategori',
      jenis: 'ch.jenis',
      status: 'ch.status',
    }
    const sortColumn = sortColumns[sort_by] || 'ch.created_at'
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    const query = `
      SELECT 
        ch.id,
        DATE_FORMAT(ch.created_at, '%d/%m/%Y') as tanggal,
        ch.guru_id,
        g.nama_lengkap as guru_nama,
        k.nama_kelas as kelas,
        m.nama_mapel as mapel,
        ch.kategori,
        ch.jenis,
        CONCAT(
          LEFT(
            (SELECT pesan FROM catatan_detail WHERE header_id = ch.id ORDER BY id ASC LIMIT 1),
            150
          ),
          CASE 
            WHEN LENGTH((SELECT pesan FROM catatan_detail WHERE header_id = ch.id ORDER BY id ASC LIMIT 1)) > 150 
            THEN '...' 
            ELSE '' 
          END
        ) as isi_preview,
        ch.status,
        ch.created_at
      FROM catatan_header ch
      JOIN guru g ON ch.guru_id = g.id
      JOIN kelas k ON ch.kelas_id = k.id
      LEFT JOIN mapel m ON ch.mapel_id = m.id
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `

    queryParams.push(limit, offset)

    db.query(query, queryParams, (error, results) => {
      if (error) {
        return reject(error)
      }
      const countQuery = `
        SELECT COUNT(*) as total
        FROM catatan_header ch
        JOIN guru g ON ch.guru_id = g.id
        WHERE ${whereClause}
      `

      db.query(countQuery, queryParams.slice(0, -2), (countError, countResults) => {
        if (countError) {
          return reject(countError)
        }

        resolve({
          data: results,
          total: countResults[0].total,
        })
      })
    })
  })
}

export const getCatatanDetail = (catatanId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        ch.id,
        DATE_FORMAT(ch.created_at, '%d/%m/%Y %H:%i') as tanggal,
        ch.created_at as timestamp,
        ch.guru_id,
        g.nama_lengkap as guru_nama,
        ch.kelas_id,
        k.nama_kelas,
        ch.mapel_id,
        m.nama_mapel,
        ch.kategori,
        ch.jenis,
        ch.status,
        ch.siswa_id
      FROM catatan_header ch
      JOIN guru g ON ch.guru_id = g.id
      JOIN kelas k ON ch.kelas_id = k.id
      LEFT JOIN mapel m ON ch.mapel_id = m.id
      WHERE ch.id = ?
    `

    db.query(query, [catatanId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results[0] || null)
    })
  })
}

export const getCatatanReplies = (catatanId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        cd.id,
        cd.pengirim_id,
        u.nama_lengkap as pengirim_nama,
        u.role as pengirim_role,
        cd.pesan,
        DATE_FORMAT(cd.created_at, '%d/%m/%Y %H:%i') as tanggal,
        cd.created_at as timestamp
      FROM catatan_detail cd
      JOIN users u ON cd.pengirim_id = u.id
      WHERE cd.header_id = ?
      ORDER BY cd.created_at ASC
    `

    db.query(query, [catatanId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results)
    })
  })
}

export const updateCatatanStatus = (catatanId) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE catatan_header 
      SET status = 'Dibaca', updated_at = NOW()
      WHERE id = ? AND status = 'Terkirim'
    `

    db.query(query, [catatanId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results.affectedRows > 0)
    })
  })
}

export const verifyCatatanExists = (catatanId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, siswa_id, status 
      FROM catatan_header 
      WHERE id = ?
    `

    db.query(query, [catatanId], (error, results) => {
      if (error) {
        return reject(error)
      }
      resolve(results[0] || null)
    })
  })
}

export const addCatatanReply = (catatanId, userId, pesan) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO catatan_detail 
      (header_id, pengirim_id, pesan, created_at)
      VALUES (?, ?, ?, NOW())
    `

    db.query(query, [catatanId, userId, pesan], (error, results) => {
      if (error) {
        return reject(error)
      }

      const updateHeaderQuery = `
        UPDATE catatan_header 
        SET updated_at = NOW() 
        WHERE id = ?
      `

      db.query(updateHeaderQuery, [catatanId], (err) => {
        if (err) {
          return reject(err)
        }
        resolve({
          reply_id: results.insertId,
          catatan_id: catatanId,
        })
      })
    })
  })
}

export default {
  getStatistikBySiswa,
  getCatatanList,
  getCatatanDetail,
  getCatatanReplies,
  updateCatatanStatus,
  verifyCatatanExists,
  addCatatanReply,
}
