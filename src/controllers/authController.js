import {
  loginService,
  getProfileService,
  changeDefaultPasswordService,
} from '../services/authService.js'

export const login = async (req, res, next) => {
  const { username, password } = req.body

  try {
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username dan password wajib diisi',
        data: null,
      })
    }

    const result = await loginService(username, password)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
      data: null,
    })
  }
}

export const getProfile = async (req, res, next) => {
  try {
    const isTempToken = req.isTempToken || false
    const result = await getProfileService(req.user.id, isTempToken)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
      data: null,
    })
  }
}

export const changeDefaultPassword = async (req, res, next) => {
  const { new_password, confirm_password } = req.body
  const userId = req.user.id

  try {
    if (!new_password || !confirm_password) {
      return res.status(400).json({
        status: 'error',
        message: 'Password baru dan konfirmasi password wajib diisi',
        data: null,
      })
    }

    const result = await changeDefaultPasswordService(userId, new_password, confirm_password)

    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
      data: null,
    })
  }
}
