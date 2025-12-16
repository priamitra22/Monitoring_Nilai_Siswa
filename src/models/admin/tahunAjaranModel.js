import db from "../../config/db.js";

export const getAllTahunAjaran = (sortBy = 'tahun', order = 'DESC') => {
  return new Promise((resolve, reject) => {
    const allowedSortBy = ['tahun', 'semester', 'tanggal_mulai', 'tanggal_selesai'];
    const allowedOrder = ['ASC', 'DESC'];

    if (!allowedSortBy.includes(sortBy)) {
      sortBy = 'tahun';
    }

    if (!allowedOrder.includes(order.toUpperCase())) {
      order = 'DESC';
    }

    let query = `
      SELECT 
        id,
        tahun,
        semester,
        status,
        DATE_FORMAT(tanggal_mulai, '%d/%m/%Y') as tanggal_mulai,
        DATE_FORMAT(tanggal_selesai, '%d/%m/%Y') as tanggal_selesai
      FROM tahun_ajaran 
      ORDER BY ${sortBy} ${order}
    `;

    if (sortBy === 'tahun') {
      query += `, semester ASC`;
    }

    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

export const getTahunAjaranAktif = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id,
        tahun,
        semester,
        status,
        DATE_FORMAT(tanggal_mulai, '%d/%m/%Y') as tanggal_mulai,
        DATE_FORMAT(tanggal_selesai, '%d/%m/%Y') as tanggal_selesai
      FROM tahun_ajaran 
      WHERE status = 'aktif'
      LIMIT 1
    `;

    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

export const getTahunAjaranById = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id,
        tahun,
        semester,
        status,
        DATE_FORMAT(tanggal_mulai, '%d/%m/%Y') as tanggal_mulai,
        DATE_FORMAT(tanggal_selesai, '%d/%m/%Y') as tanggal_selesai
      FROM tahun_ajaran 
      WHERE id = ?
    `;

    db.query(query, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

export const createTahunAjaran = (data) => {
  return new Promise((resolve, reject) => {
    const { tahun, semester, tanggal_mulai, tanggal_selesai, status = 'tidak-aktif' } = data;

    const query = `
      INSERT INTO tahun_ajaran (tahun, semester, tanggal_mulai, tanggal_selesai, status)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [tahun, semester, tanggal_mulai, tanggal_selesai, status], (err, results) => {
      if (err) return reject(err);
      resolve({
        id: results.insertId,
        tahun,
        semester,
        tanggal_mulai,
        tanggal_selesai,
        status
      });
    });
  });
};

export const checkTahunAjaranUsage = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM kelas WHERE tahun_ajaran_id = ?) as kelas_count,
        (SELECT COUNT(*) FROM nilai WHERE tahun_ajaran_id = ?) as nilai_count
    `;

    db.query(query, [id, id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

export const checkActiveTahunAjaran = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COUNT(*) as active_count 
      FROM tahun_ajaran 
      WHERE status = 'aktif'
    `;

    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

export const checkDuplicateTahunAjaran = (tahun, semester, excludeId = null) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT COUNT(*) as duplicate_count 
      FROM tahun_ajaran 
      WHERE tahun = ? AND semester = ?
    `;

    const params = [tahun, semester];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

export const checkDateOverlap = (tanggal_mulai, tanggal_selesai, excludeId = null) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT COUNT(*) as overlap_count 
      FROM tahun_ajaran 
      WHERE (
        (tanggal_mulai <= ? AND tanggal_selesai >= ?) OR
        (tanggal_mulai <= ? AND tanggal_selesai >= ?) OR
        (tanggal_mulai >= ? AND tanggal_selesai <= ?)
      )
    `;

    const params = [tanggal_mulai, tanggal_mulai, tanggal_selesai, tanggal_selesai, tanggal_mulai, tanggal_selesai];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

export const toggleTahunAjaranStatus = (id) => {
  return new Promise((resolve, reject) => {
    const getQuery = `SELECT id, status FROM tahun_ajaran WHERE id = ?`;

    db.query(getQuery, [id], (err, results) => {
      if (err) return reject(err);

      if (results.length === 0) {
        return reject(new Error("Tahun ajaran tidak ditemukan"));
      }

      const currentStatus = results[0].status;
      const newStatus = currentStatus === 'aktif' ? 'tidak-aktif' : 'aktif';

      const updateQuery = `UPDATE tahun_ajaran SET status = ? WHERE id = ?`;

      db.query(updateQuery, [newStatus, id], (err, updateResults) => {
        if (err) return reject(err);

        resolve({
          id,
          old_status: currentStatus,
          new_status: newStatus,
          message: `Status tahun ajaran berhasil diubah dari '${currentStatus}' menjadi '${newStatus}'`
        });
      });
    });
  });
};

export const deleteTahunAjaran = (id) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM tahun_ajaran WHERE id = ?`;

    db.query(query, [id], (err, results) => {
      if (err) return reject(err);
      if (results.affectedRows === 0) {
        return reject(new Error("Tahun ajaran tidak ditemukan"));
      }
      resolve({ id, message: "Tahun ajaran berhasil dihapus" });
    });
  });
};
