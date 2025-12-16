import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { findUserWithRoleData, findUserByIdWithRoleData } from '../models/userModel.js'
import { updateLastLogin } from '../models/userModel.js'

export const loginService = async (username, password) => {
  if (!/^\d+$/.test(username)) {
    throw new Error('Username harus berupa angka')
  }

  if (password.length < 8) {
    throw new Error('Password minimal 8 karakter')
  }

  const user = await findUserWithRoleData(username)

  if (!user) {
    throw new Error('Username tidak valid')
  }

  if (user.status !== 'aktif') {
    throw new Error('Akun Anda tidak aktif, hubungi administrator')
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    throw new Error('Password salah')
  }

  if (user.must_change_password === 1) {
    const tempPayload = {
      id: user.id,
      role: user.role,
      temp: true,
    }
    const tempToken = jwt.sign(tempPayload, process.env.JWT_SECRET, { expiresIn: '30m' })

    return {
      status: 'success',
      message: 'Anda harus mengubah password default',
      data: {
        force_password_change: true,
        temp_token: tempToken,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          nama:
            user.role === 'admin'
              ? user.nama_lengkap
              : user.role === 'guru'
                ? user.guru_nama
                : user.ortu_nama,
        },
      },
    }
  }

  await updateLastLogin(user.id)

  const payload = {
    id: user.id,
    role: user.role,
  }

  if (user.role === 'guru' && user.guru_id) {
    payload.guru_id = user.guru_id
  }
  if (user.role === 'ortu') {
    if (user.orangtua_id) {
      payload.orangtua_id = user.orangtua_id
    }
    if (user.siswa_id) {
      payload.siswa_id = user.siswa_id
    }
    if (user.siswa_nisn) {
      payload.siswa_nisn = user.siswa_nisn
    }
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })

  let responseData = {
    id: user.id,
    username: user.username,
    role: user.role,
    nama: '',
  }
  switch (user.role) {
    case 'admin':
      responseData.nama = user.nama_lengkap
      break
    case 'guru':
      responseData.nama = user.guru_nama
      break
    case 'ortu':
      responseData.nama = user.ortu_nama
      responseData.nama_anak = user.siswa_nama
      break
  }

  return {
    status: 'success',
    message: 'Login berhasil',
    data: {
      force_password_change: false,
      token,
      user: responseData,
    },
  }
}


const validatePasswordPolicy = (password) => {
  if (password.length < 8) {
    return { valid: false, message: 'Password minimal 8 karakter' }
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung huruf' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung angka' }
  }

  return { valid: true }
}

export const changeDefaultPasswordService = async (userId, newPassword, confirmPassword) => {
  if (newPassword !== confirmPassword) {
    throw new Error('Konfirmasi password tidak cocok')
  }
  const validation = validatePasswordPolicy(newPassword)
  if (!validation.valid) {
    throw new Error(validation.message)
  }
  const user = await findUserByIdWithRoleData(userId)
  if (!user) {
    throw new Error('User tidak ditemukan')
  }
  const isSameAsOld = await bcrypt.compare(newPassword, user.password)
  if (isSameAsOld) {
    throw new Error('Password baru tidak boleh sama dengan password lama')
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  const db = await import('../config/db.js')
  await new Promise((resolve, reject) => {
    const query = `
      UPDATE users 
      SET password = ?, must_change_password = 0 
      WHERE id = ?
    `
    db.default.query(query, [hashedPassword, userId], (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
  await updateLastLogin(userId)
  const payload = {
    id: user.id,
    role: user.role,
  }

  if (user.role === 'guru' && user.guru_id) {
    payload.guru_id = user.guru_id
  }

  if (user.role === 'ortu') {
    if (user.orangtua_id) {
      payload.orangtua_id = user.orangtua_id
    }
    if (user.siswa_id) {
      payload.siswa_id = user.siswa_id
    }
    if (user.siswa_nisn) {
      payload.siswa_nisn = user.siswa_nisn
    }

    if (!payload.siswa_id && user.username) {
      const { findUserWithRoleData } = await import('../models/userModel.js')
      const fullUserData = await findUserWithRoleData(user.username)

      if (fullUserData && fullUserData.siswa_id) {
        payload.siswa_id = fullUserData.siswa_id
        payload.siswa_nisn = fullUserData.siswa_nisn || user.username
      }
    }
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })

  let responseData = {
    id: user.id,
    username: user.username,
    role: user.role,
    nama: '',
  }

  switch (user.role) {
    case 'admin':
      responseData.nama = user.nama_lengkap
      break
    case 'guru':
      responseData.nama = user.guru_nama
      break
    case 'ortu':
      responseData.nama = user.ortu_nama
      responseData.nama_anak = user.siswa_nama
      break
  }

  return {
    status: 'success',
    message: 'Password berhasil diubah',
    data: {
      token,
      user: responseData,
    },
  }
}

export const getProfileService = async (userId, isTempToken = false) => {
  const user = await findUserByIdWithRoleData(userId)

  if (!user) {
    throw new Error('User tidak ditemukan')
  }
  if (user.status !== 'aktif') {
    throw new Error('Akun Anda tidak aktif, hubungi administrator')
  }
  let responseData = {
    id: user.id,
    username: user.username,
    role: user.role,
    nama: '',
  }
  e
  switch (user.role) {
    case 'admin':
      responseData.nama = user.nama_lengkap
      break
    case 'guru':
      responseData.nama = user.guru_nama
      break
    case 'ortu':
      responseData.nama = user.ortu_nama
      responseData.nama_anak = user.siswa_nama
      break
  }
  const response = {
    status: 'success',
    message: 'Token valid',
    data: responseData,
  }
  if (isTempToken) {
    response.data.force_password_change = true
  }

  return response
}
