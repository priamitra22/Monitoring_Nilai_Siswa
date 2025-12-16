import jwt from 'jsonwebtoken'

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Token tidak ditemukan',
      data: null,
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded

    req.isTempToken = decoded.temp === true

    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token sudah kadaluarsa, silakan login kembali',
        data: null,
      })
    }

    return res.status(401).json({
      status: 'error',
      message: 'Token tidak valid',
      data: null,
    })
  }
}

export const tempAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Token tidak ditemukan',
      data: null,
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (!decoded.temp) {
      return res.status(401).json({
        status: 'error',
        message: 'Token tidak valid untuk operasi ini',
        data: null,
      })
    }

    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token sudah kadaluarsa, silakan login kembali',
        data: null,
      })
    }

    return res.status(401).json({
      status: 'error',
      message: 'Token tidak valid',
      data: null,
    })
  }
}
