import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import chalk from 'chalk'
import authRoutes from './routes/authRoutes.js'
import adminKelasRoutes from './routes/admin/kelasRoutes.js'
import adminTahunAjaranRoutes from './routes/admin/tahunAjaranRoutes.js'
import adminSiswaRoutes from './routes/admin/siswaRoutes.js'
import adminGuruRoutes from './routes/admin/guruRoutes.js'
import adminOrtuRoutes from './routes/admin/ortuRoutes.js'
import adminUserRoutes from './routes/admin/userRoutes.js'
import adminDashboardRoutes from './routes/admin/dashboardRoutes.js'
import adminLaporanRoutes from './routes/admin/laporanRoutes.js'
import adminLaporanResmiRoutes from './routes/admin/laporanResmiRoutes.js'
import guruAbsensiRoutes from './routes/guru/absensiRoutes.js'
import guruCatatanRoutes from './routes/guru/catatanRoutes.js'
import guruNilaiRoutes from './routes/guru/nilaiRoutes.js'
import guruChatRoutes from './routes/guru/chatRoutes.js'
import guruLaporanRoutes from './routes/guru/laporanRoutes.js'
import guruDashboardRoutes from './routes/guru/dashboardRoutes.js'
import guruLaporanResmiRoutses from './routes/guru/laporanResmiRoutes.js'
import ortuDashboardRoutes from './routes/ortu/dashboardRoutes.js'
import ortuNilaiRoutes from './routes/ortu/nilaiRoutes.js'
import ortuAbsensiRoutes from './routes/ortu/absensiRoutes.js'
import ortuCatatanRoutes from './routes/ortu/catatanRoutes.js'
import ortuChatRoutes from './routes/ortu/chatRoutes.js'
import ortuLaporanRoutes from './routes/ortu/laporanRoutes.js'
import ortuLaporanResmiRoutes from './routes/ortu/laporanResmiRoutes.js'
import { createServer } from 'http'
import { initSocket } from './socket/index.js'

import { errorHandler } from './middlewares/errorMiddleware.js'

dotenv.config()
const app = express()
const server = createServer(app)
const io = initSocket(server)
app.set('io', io)

const isDev = process.env.NODE_ENV !== 'production'

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  })
)
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/admin/kelas', adminKelasRoutes)
app.use('/api/admin/tahun-ajaran', adminTahunAjaranRoutes)
app.use('/api/admin/siswa', adminSiswaRoutes)
app.use('/api/admin/guru', adminGuruRoutes)
app.use('/api/admin/ortu', adminOrtuRoutes)
app.use('/api/admin/users', adminUserRoutes)
app.use('/api/admin/dashboard', adminDashboardRoutes)
app.use('/api/admin/laporan', adminLaporanRoutes)
app.use('/api/admin/laporan-resmi', adminLaporanResmiRoutes)
app.use('/api/guru/absensi', guruAbsensiRoutes)
app.use('/api/guru/catatan', guruCatatanRoutes)
app.use('/api/guru/nilai', guruNilaiRoutes)
app.use('/api/guru/chat', guruChatRoutes)
app.use('/api/guru/laporan', guruLaporanRoutes)
app.use('/api/guru/dashboard', guruDashboardRoutes)
app.use('/api/ortu/dashboard', ortuDashboardRoutes)
app.use('/api/guru/laporan-resmi', guruLaporanResmiRoutses)
app.use('/api/ortu/nilai', ortuNilaiRoutes)
app.use('/api/ortu/absensi', ortuAbsensiRoutes)
app.use('/api/ortu/catatan', ortuCatatanRoutes)
app.use('/api/ortu/chat', ortuChatRoutes)
app.use('/api/ortu/laporan', ortuLaporanRoutes)
app.use('/api/ortu/laporan-resmi', ortuLaporanResmiRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  if (isDev) {
    console.log(`📡 URL: http://localhost:${PORT}`)
  }
})
