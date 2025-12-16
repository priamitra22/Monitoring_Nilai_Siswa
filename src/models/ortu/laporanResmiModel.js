import db from '../../config/db.js'

export const getAllLaporanBySiswa = (siswaId) => {
    return new Promise((resolve, reject) => {
        const query = `
      SELECT
        lr.id,
        lr.siswa_id,
        s.nisn,
        s.nama_lengkap as nama_siswa,
        k.nama_kelas as kelas_nama,
        ta.tahun as tahun_ajaran,
        lr.semester,
        lr.version,
        lr.is_latest,
        lr.original_filename,
        lr.file_size,
        lr.upload_date,
        lr.keterangan
      FROM laporan_resmi lr
      JOIN siswa s ON lr.siswa_id = s.id
      JOIN kelas k ON lr.kelas_id = k.id
      JOIN tahun_ajaran ta ON lr.tahun_ajaran_id = ta.id
      WHERE lr.siswa_id = ?
      ORDER BY 
        ta.tahun DESC,
        CASE lr.semester
          WHEN 'Ganjil' THEN 1
          WHEN 'Genap' THEN 2
        END,
        lr.version DESC
    `

        db.query(query, [siswaId], (error, results) => {
            if (error) {
                return reject(error)
            }
            resolve(results)
        })
    })
}

export const getLaporanById = (laporanId) => {
    return new Promise((resolve, reject) => {
        const query = `
      SELECT
        lr.*,
        os.orangtua_id,
        s.nama_lengkap as nama_siswa,
        ta.tahun as tahun_ajaran
      FROM laporan_resmi lr
      JOIN siswa s ON lr.siswa_id = s.id
      JOIN orangtua_siswa os ON s.id = os.siswa_id
      JOIN tahun_ajaran ta ON lr.tahun_ajaran_id = ta.id
      WHERE lr.id = ?
    `

        db.query(query, [laporanId], (error, results) => {
            if (error) {
                return reject(error)
            }
            resolve(results[0] || null)
        })
    })
}

export const getSiswaByOrtuId = (ortuId) => {
    return new Promise((resolve, reject) => {
        const query = `
      SELECT 
        s.id as siswa_id,
        s.nisn,
        s.nama_lengkap
      FROM siswa s
      JOIN orangtua_siswa os ON s.id = os.siswa_id
      WHERE os.orangtua_id = ?
      LIMIT 1
    `

        db.query(query, [ortuId], (error, results) => {
            if (error) {
                return reject(error)
            }
            resolve(results[0] || null)
        })
    })
}

export default {
    getAllLaporanBySiswa,
    getLaporanById,
    getSiswaByOrtuId,
}
