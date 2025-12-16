import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadDir = 'uploads/laporan_resmi'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const laporanResmiStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },

  filename: (req, file, cb) => {
    try {
      const timestamp = Date.now()
      const tempFilename = `temp_${timestamp}.pdf`
      cb(null, tempFilename)
    } catch (error) {
      cb(error, null)
    }
  },
})

const pdfFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()
  if (ext !== '.pdf') {
    return cb(new Error('File harus berformat PDF'), false)
  }

  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('File harus berformat PDF'), false)
  }

  cb(null, true)
}

export const uploadLaporanResmi = multer({
  storage: laporanResmiStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})

export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'Ukuran file terlalu besar',
        errors: {
          file: 'Ukuran file maksimal 5MB',
        },
      })
    }

    return res.status(400).json({
      status: 'error',
      message: 'Error saat upload file',
      errors: {
        file: err.message,
      },
    })
  }

  if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message,
      errors: {
        file: err.message,
      },
    })
  }

  next()
}

export const generateLaporanFilename = (siswaId, version, namaSiswa) => {
  const timestamp = Date.now()
  const sanitizedName = namaSiswa.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')

  return `${siswaId}_v${version}_${timestamp}_${sanitizedName}.pdf`
}

export const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(process.cwd(), filePath)

    fs.unlink(fullPath, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          resolve(true)
        } else {
          reject(err)
        }
      } else {
        resolve(true)
      }
    })
  })
}

export const renameFile = (oldPath, newPath) => {
  return new Promise((resolve, reject) => {
    const fullOldPath = path.join(process.cwd(), oldPath)
    const fullNewPath = path.join(process.cwd(), newPath)

    fs.rename(fullOldPath, fullNewPath, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(true)
      }
    })
  })
}

export const fileExists = (filePath) => {
  const fullPath = path.join(process.cwd(), filePath)
  return fs.existsSync(fullPath)
}
