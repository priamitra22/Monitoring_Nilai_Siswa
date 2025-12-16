import {
  getAllDataUsers,
  getUsersStatistics,
  getAvailableGuru,
  getAvailableOrtu,
  getChildrenByParent,
  checkUsernameExists,
  findGuruByNip,
  findSiswaByNisnForOrtu,
  checkUserExistsForOrtuUsername,
  createUser,
  createBulkUsers,
  resetUserPassword,
  getUserById,
  deleteUserById
} from "../../models/admin/userModel.js";

export const fetchDataUsers = async (
  page = 1,
  limit = 10,
  search = "",
  role = "",
  status = "",
  sortBy = "nama_lengkap",
  sortOrder = "ASC"
) => {
  try {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    if (pageNum < 1) {
      return { status: "error", message: "Halaman harus lebih dari 0", data: null };
    }

    if (limitNum < 1 || limitNum > 100) {
      return { status: "error", message: "Limit harus antara 1-100", data: null };
    }

    const validSortColumns = ['nama_lengkap', 'username', 'role', 'status', 'last_login', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];

    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'nama_lengkap';
    const sortDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

    const roleMapping = {
      'admin': 'admin',
      'guru': 'guru',
      'orangtua': 'ortu',
      'ortu': 'ortu'
    };

    const validRoles = ['admin', 'guru', 'ortu'];
    const mappedRole = roleMapping[role] || '';
    const roleFilter = validRoles.includes(mappedRole) ? mappedRole : "";

    const validStatuses = ['aktif', 'tidak-aktif'];
    const statusFilter = validStatuses.includes(status) ? status : "";

    const [usersResult, statisticsResult] = await Promise.all([
      getAllDataUsers(pageNum, limitNum, search, roleFilter, statusFilter, sortColumn, sortDirection),
      getUsersStatistics(search, roleFilter, statusFilter)
    ]);

    return {
      status: "success",
      message: "Data akun pengguna berhasil diambil",
      data: {
        users: usersResult.data,
        pagination: usersResult.pagination,
        statistics: statisticsResult
      }
    };
  } catch (error) {
    console.error("Error in fetchDataUsers:", error);
    return { status: "error", message: error.message, data: null };
  }
};

export const fetchAvailableGuru = async (search = "", limit = 50) => {
  try {
    const limitNum = parseInt(limit) || 50;

    if (limitNum < 1 || limitNum > 100) {
      return { status: "error", message: "Limit harus antara 1-100", data: null };
    }

    const result = await getAvailableGuru(search, limitNum);

    return {
      status: "success",
      message: "Data guru tersedia berhasil diambil",
      data: {
        guru: result.data,
        total_available: result.total_available
      }
    };
  } catch (error) {
    console.error("Error in fetchAvailableGuru:", error);
    return { status: "error", message: error.message, data: null };
  }
};

export const fetchAvailableOrtu = async (search = "", limit = 50) => {
  try {
    const limitNum = parseInt(limit) || 50;

    if (limitNum < 1 || limitNum > 100) {
      return { status: "error", message: "Limit harus antara 1-100", data: null };
    }

    const result = await getAvailableOrtu(search, limitNum);

    return {
      status: "success",
      message: "Data orangtua tersedia berhasil diambil",
      data: {
        ortu: result.data,
        total_available: result.total_available
      }
    };
  } catch (error) {
    console.error("Error in fetchAvailableOrtu:", error);
    return { status: "error", message: error.message, data: null };
  }
};

export const fetchChildrenByParent = async (ortuId, search = "", limit = 50) => {
  try {
    const ortuIdNum = parseInt(ortuId);
    if (!ortuIdNum || ortuIdNum < 1) {
      return { status: "error", message: "ID orangtua tidak valid", data: null };
    }

    const limitNum = parseInt(limit) || 50;

    if (limitNum < 1 || limitNum > 100) {
      return { status: "error", message: "Limit harus antara 1-100", data: null };
    }

    const result = await getChildrenByParent(ortuIdNum, search, limitNum);

    return {
      status: "success",
      message: "Data anak berhasil diambil",
      data: {
        anak: result.data,
        total_available: result.total_available
      }
    };
  } catch (error) {
    console.error("Error in fetchChildrenByParent:", error);
    return { status: "error", message: error.message, data: null };
  }
};

export const validateFieldService = async (payload) => {
  try {
    const {
      role,
      field,
      value,
      mode = "create",
      exclude_user_id = null,
      guru_id = null,
      ortu_id = null
    } = payload || {};

    if (!role || !field) {
      return { status: "error", message: "Role dan field wajib diisi", data: null };
    }

    const normalizedRole = role === "orangtua" ? "ortu" : role;
    const ok = (msg = "Valid") => ({ status: "success", message: msg, data: { valid: true } });
    const bad = (msg, reasons = []) => ({ status: "success", message: msg, data: { valid: false, reasons } });

    if (normalizedRole === "admin" && field === "username") {
      const username = String(value || "").trim();
      if (!username) return bad("Username harus diisi", ["required"]);
      if (!/^\d{8,}$/.test(username)) return bad("Username harus berupa angka minimal 8 digit", ["format"]);
      const exists = await checkUsernameExists(value, exclude_user_id);
      if (exists) return bad("Username sudah digunakan", ["duplicate_username"]);
      return ok();
    }

    if (normalizedRole === "guru" && field === "username") {
      const nip = String(value || "").trim();
      if (!/^\d{8,20}$/.test(nip)) return bad("Format NIP tidak valid", ["format"]);
      const guru = await findGuruByNip(nip);
      if (!guru) return bad("NIP tidak ditemukan di master guru", ["not_found"]);
      if (guru.user_id) return bad("Guru ini sudah memiliki akun", ["already_linked"]);
      const exists = await checkUsernameExists(nip, exclude_user_id);
      if (exists) return bad("Username (NIP) sudah digunakan", ["duplicate_username"]);
      return ok();
    }

    if (normalizedRole === "ortu" && field === "username") {
      const nisn = String(value || "").trim();
      if (!/^\d{8,12}$/.test(nisn)) return bad("Format NISN tidak valid", ["format"]);
      if (!ortu_id) return { status: "error", message: "ortu_id wajib diisi untuk role ortu", data: null };
      const siswa = await findSiswaByNisnForOrtu(ortu_id, nisn);
      if (!siswa) return bad("NISN tidak terkait dengan orangtua ini", ["relation_missing"]);
      const alreadyForThisOrtu = await checkUserExistsForOrtuUsername(ortu_id, nisn, exclude_user_id);
      if (alreadyForThisOrtu) return bad("Akun untuk NISN ini pada orangtua ini sudah ada", ["duplicate_for_ortu"]);
      const existsGlobal = await checkUsernameExists(nisn, exclude_user_id);
      if (existsGlobal) return bad("Username sudah digunakan", ["duplicate_username"]);
      return ok();
    }

    return { status: "error", message: "Kombinasi role/field tidak didukung", data: null };
  } catch (error) {
    console.error("Error in validateFieldService:", error);
    return { status: "error", message: error.message, data: null };
  }
};

export const createUserService = async (userData) => {
  try {
    const { role, nama_lengkap, username, guru_id, ortu_id, anak_id } = userData;

    const normalizedRole = role === 'orangtua' ? 'ortu' : role;

    if (!normalizedRole || !['admin', 'guru', 'ortu'].includes(normalizedRole)) {
      return { status: "error", message: "Role harus admin, guru, atau ortu", data: null };
    }

    let finalUsername = username;
    let finalNamaLengkap = nama_lengkap;
    let finalOrtuId = ortu_id;

    if (normalizedRole === 'admin') {

      if (!username || !/^\d{8,}$/.test(username)) {
        return { status: "error", message: "Username admin harus berupa angka minimal 8 digit", data: null };
      }

      const usernameExists = await checkUsernameExists(username);
      if (usernameExists) {
        return { status: "error", message: "Username sudah digunakan", data: null };
      }

      if (!nama_lengkap || nama_lengkap.trim().length < 2) {
        return { status: "error", message: "Nama lengkap harus diisi minimal 2 karakter", data: null };
      }

      finalNamaLengkap = nama_lengkap;
      finalUsername = username;
    }

    if (normalizedRole === 'guru') {
      if (!guru_id) {
        return { status: "error", message: "guru_id wajib diisi untuk role guru", data: null };
      }

      const guru = await findGuruById(guru_id);
      if (!guru) {
        return { status: "error", message: "Guru tidak ditemukan", data: null };
      }
      if (guru.user_id) {
        return { status: "error", message: "Guru ini sudah memiliki akun", data: null };
      }

      finalNamaLengkap = guru.nama_lengkap;
      finalUsername = guru.nip;
    }

    if (normalizedRole === 'ortu') {
      if (!ortu_id) {
        return { status: "error", message: "ortu_id wajib diisi untuk role ortu", data: null };
      }

      if (!anak_id) {
        return { status: "error", message: "anak_id wajib diisi untuk role ortu (username = NISN anak)", data: null };
      }

      const ortu = await findOrtuById(ortu_id);
      if (!ortu) {
        return { status: "error", message: "Orangtua tidak ditemukan", data: null };
      }

      const anak = await findSiswaById(anak_id);
      if (!anak) {
        return { status: "error", message: "Anak tidak ditemukan", data: null };
      }

      const isAnakValid = await checkAnakBelongsToOrtu(anak_id, ortu_id);
      if (!isAnakValid) {
        return { status: "error", message: "Anak tidak terkait dengan orangtua ini", data: null };
      }

      const existingUser = await checkUsernameExists(anak.nisn);
      if (existingUser) {
        return { status: "error", message: `Username ${anak.nisn} (NISN anak) sudah digunakan`, data: null };
      }

      finalNamaLengkap = ortu.nama_lengkap;
      finalUsername = anak.nisn;
      finalOrtuId = ortu_id;
    }

    if (!finalNamaLengkap || finalNamaLengkap.trim().length < 2) {
      return { status: "error", message: "Nama lengkap harus diisi dan minimal 2 karakter", data: null };
    }

    if (!finalUsername || finalUsername.trim().length < 3) {
      return { status: "error", message: "Username harus diisi dan minimal 3 karakter", data: null };
    }

    const password = generateDefaultPassword();

    const newUser = await createUser({
      nama_lengkap: finalNamaLengkap,
      username: finalUsername,
      role: normalizedRole,
      status: 'aktif',
      ortu_id: finalOrtuId,
      password: await hashPassword(password)
    });

    if (normalizedRole === 'guru' && guru_id) {
      await updateGuruUserId(guru_id, newUser.id);
    }

    return {
      status: "success",
      message: "Akun pengguna berhasil dibuat",
      data: {
        user: newUser,
        password: password
      }
    };

  } catch (error) {
    console.error("Error in createUserService:", error);

    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage && error.sqlMessage.includes('username')) {
        return { status: "error", message: "Username sudah digunakan", data: null };
      }
      return { status: "error", message: "Data duplikat ditemukan", data: null };
    }

    if (error.code && error.code.startsWith('ER_')) {
      return { status: "error", message: `Database error: ${error.sqlMessage || error.message}`, data: null };
    }

    return { status: "error", message: error.message || "Terjadi kesalahan saat membuat akun", data: null };
  }
};

export const createBulkUsersService = async (usersData) => {
  try {
    if (!usersData || !Array.isArray(usersData) || usersData.length === 0) {
      return { status: "error", message: "Data users tidak boleh kosong", data: null };
    }

    if (usersData.length > 50) {
      return { status: "error", message: "Maksimal 50 akun per batch", data: null };
    }

    const results = {
      success: [],
      failed: [],
      total: usersData.length
    };

    for (let i = 0; i < usersData.length; i++) {
      const userData = usersData[i];
      const displayName = userData.nama_lengkap || userData.username || `Akun ${i + 1}`;

      try {
        const result = await createUserService(userData);
        if (result.status === "success") {
          results.success.push({
            index: i,
            nama: displayName,
            data: result.data.user,
            password: result.data.password
          });
        } else {
          results.failed.push({
            index: i,
            nama: displayName,
            data: userData,
            error: result.message || "Gagal membuat akun"
          });
        }
      } catch (error) {
        let errorMessage = "Terjadi kesalahan tidak terduga";

        if (error.code === 'ER_DUP_ENTRY') {
          if (error.sqlMessage && error.sqlMessage.includes('username')) {
            errorMessage = "Username sudah digunakan";
          } else {
            errorMessage = "Data duplikat ditemukan";
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        results.failed.push({
          index: i,
          nama: displayName,
          data: userData,
          error: errorMessage
        });
      }
    }

    const successCount = results.success.length;
    const failedCount = results.failed.length;

    return {
      status: "success",
      message: `Berhasil membuat ${successCount} akun, gagal ${failedCount} akun`,
      data: {
        summary: {
          total: results.total,
          success: successCount,
          failed: failedCount
        },
        results
      }
    };

  } catch (error) {
    console.error("Error in createBulkUsersService:", error);
    return { status: "error", message: error.message, data: null };
  }
};

const generateDefaultPassword = () => {
  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const year = wib.getFullYear();
  const month = String(wib.getMonth() + 1).padStart(2, '0');
  const day = String(wib.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const hashPassword = async (password) => {
  const bcrypt = await import('bcrypt');
  return await bcrypt.hash(password, 10);
};

const findGuruById = async (guruId) => {
  const { default: db } = await import("../../config/db.js");
  return new Promise((resolve, reject) => {
    const query = `SELECT id, nama_lengkap, nip, user_id FROM guru WHERE id = ?`;
    db.query(query, [guruId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
};

const findOrtuById = async (ortuId) => {
  const { default: db } = await import("../../config/db.js");
  return new Promise((resolve, reject) => {
    const query = `SELECT id, nama_lengkap, nik, kontak, relasi FROM orangtua WHERE id = ?`;
    db.query(query, [ortuId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
};

const updateGuruUserId = async (guruId, userId) => {
  const { default: db } = await import("../../config/db.js");
  return new Promise((resolve, reject) => {
    const query = `UPDATE guru SET user_id = ? WHERE id = ?`;
    db.query(query, [userId, guruId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

const findSiswaById = async (siswaId) => {
  const { default: db } = await import("../../config/db.js");
  return new Promise((resolve, reject) => {
    const query = `SELECT id, nama_lengkap, nisn FROM siswa WHERE id = ?`;
    db.query(query, [siswaId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
};

const checkAnakBelongsToOrtu = async (anakId, ortuId) => {
  const { default: db } = await import("../../config/db.js");
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COUNT(*) as cnt 
      FROM orangtua_siswa 
      WHERE siswa_id = ? AND orangtua_id = ?
    `;
    db.query(query, [anakId, ortuId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].cnt > 0);
    });
  });
};

export const resetPasswordService = async (userId) => {
  try {
    if (!userId || isNaN(userId)) {
      return { status: "error", message: "User ID tidak valid", data: null };
    }

    const user = await getUserById(userId);
    if (!user) {
      return { status: "error", message: "User tidak ditemukan", data: null };
    }

    const newPassword = generateDefaultPassword();

    const hashedPassword = await hashPassword(newPassword);

    await resetUserPassword(userId, hashedPassword);

    return {
      status: "success",
      message: `Password berhasil direset untuk ${user.nama_lengkap}`,
      data: {
        user: {
          id: user.id,
          nama_lengkap: user.nama_lengkap,
          username: user.username,
          role: user.role
        },
        new_password: newPassword
      }
    };

  } catch (error) {
    console.error("Error in resetPasswordService:", error);
    return { status: "error", message: error.message || "Terjadi kesalahan saat reset password", data: null };
  }
};

export const deleteUserService = async (userId, currentUserId) => {
  try {
    if (!userId || isNaN(userId)) {
      return { status: "error", message: "User ID tidak valid", data: null };
    }

    const userIdNum = parseInt(userId);
    const currentUserIdNum = parseInt(currentUserId);

    if (userIdNum === currentUserIdNum) {
      return { status: "error", message: "Tidak dapat menghapus akun Anda sendiri", data: null };
    }

    const user = await getUserById(userIdNum);
    if (!user) {
      return { status: "error", message: "User tidak ditemukan", data: null };
    }

    await deleteUserById(userIdNum);

    return {
      status: "success",
      message: `Akun ${user.nama_lengkap} berhasil dihapus`,
      data: {
        deleted_user: {
          id: user.id,
          nama_lengkap: user.nama_lengkap,
          username: user.username,
          role: user.role,
          status: user.status
        }
      }
    };

  } catch (error) {
    console.error("Error in deleteUserService:", error);
    return { status: "error", message: error.message || "Terjadi kesalahan saat menghapus user", data: null };
  }
};
