import db from "../config/db.js";

export const findUserByUsername = (username) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

export const findUserWithRoleData = (username) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        u.*,
        g.id as guru_id,
        g.nama_lengkap as guru_nama,
        o.id as orangtua_id,
        o.nama_lengkap as ortu_nama,
        s.id as siswa_id,
        s.nama_lengkap as siswa_nama,
        s.nisn as siswa_nisn
      FROM users u
      LEFT JOIN guru g ON u.id = g.user_id
      LEFT JOIN orangtua o ON u.ortu_id = o.id  
      LEFT JOIN siswa s ON s.nisn = u.username AND u.role = 'ortu'
      WHERE u.username = ?
    `;

    db.query(query, [username], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

export const findUserByIdWithRoleData = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        u.*,
        g.id as guru_id,
        g.nama_lengkap as guru_nama,
        o.id as orangtua_id,
        o.nama_lengkap as ortu_nama,
        s.nama_lengkap as siswa_nama
      FROM users u
      LEFT JOIN guru g ON u.id = g.user_id
      LEFT JOIN orangtua o ON u.ortu_id = o.id  
      LEFT JOIN orangtua_siswa os ON o.id = os.orangtua_id
      LEFT JOIN siswa s ON os.siswa_id = s.id
      WHERE u.id = ?
    `;

    db.query(query, [userId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

export const updateLastLogin = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE users 
      SET last_login = CONVERT_TZ(NOW(), @@session.time_zone, '+07:00') 
      WHERE id = ?
    `;

    db.query(query, [userId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};
export const getAllUsers = (page = 1, limit = 10, search = "", role = "", status = "", sortBy = "nama_lengkap", sortOrder = "ASC") => {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        u.id,
        u.nama_lengkap,
        u.username,
        u.role,
        u.status,
        u.last_login,
        u.created_at
      FROM users u
      WHERE 1=1
    `;

    let countQuery = `SELECT COUNT(*) as total FROM users u WHERE 1=1`;
    const params = [];
    const countParams = [];
    if (search) {
      const searchPattern = `%${search}%`;
      query += ` AND (u.nama_lengkap LIKE ? OR u.username LIKE ?)`;
      countQuery += ` AND (u.nama_lengkap LIKE ? OR u.username LIKE ?)`;
      params.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }
    if (role && role !== "") {
      query += ` AND u.role = ?`;
      countQuery += ` AND u.role = ?`;
      params.push(role);
      countParams.push(role);
    }
    if (status && status !== "") {
      query += ` AND u.status = ?`;
      countQuery += ` AND u.status = ?`;
      params.push(status);
      countParams.push(status);
    }
    const validSortColumns = ['nama_lengkap', 'username', 'role', 'status', 'last_login', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'nama_lengkap';
    const sortDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';
    query += ` ORDER BY u.${sortColumn} ${sortDirection}`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.query(countQuery, countParams, (err, countResult) => {
      if (err) return reject(err);

      const total = countResult[0].total;

      db.query(query, params, (err, results) => {
        if (err) return reject(err);

        const totalPages = Math.ceil(total / limit);

        resolve({
          users: results,
          pagination: {
            current_page: page,
            total_pages: totalPages,
            total_data: total,
            per_page: limit,
            has_next: page < totalPages,
            has_prev: page > 1
          }
        });
      });
    });
  });
};

export const getUserStatistics = (search = "", role = "", status = "") => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        COUNT(*) as total_akun,
        SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as akun_aktif,
        SUM(CASE WHEN status = 'tidak-aktif' THEN 1 ELSE 0 END) as akun_tidak_aktif,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin,
        SUM(CASE WHEN role = 'guru' THEN 1 ELSE 0 END) as guru,
        SUM(CASE WHEN role = 'ortu' THEN 1 ELSE 0 END) as orangtua
      FROM users u
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      const searchPattern = `%${search}%`;
      query += ` AND (u.nama_lengkap LIKE ? OR u.username LIKE ?)`;
      params.push(searchPattern, searchPattern);
    }

    if (role && role !== "") {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (status && status !== "") {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};