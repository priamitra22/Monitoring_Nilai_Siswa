import laporanResmiService from '../../services/ortu/laporanResmiService.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const getOrtuId = (req) => {
    if (!req.user || !req.user.orangtua_id) {
        throw new Error('Orangtua ID tidak ditemukan. Pastikan Anda login sebagai orang tua.')
    }
    return req.user.orangtua_id
}

export const getAllLaporan = async (req, res, next) => {
    try {
        const ortuId = getOrtuId(req)

        const laporan = await laporanResmiService.getAllLaporanService(ortuId)

        res.status(200).json({
            status: 'success',
            message: laporan.length > 0 ? 'Data laporan resmi berhasil diambil' : 'Belum ada laporan resmi',
            data: {
                laporan,
            },
        })
    } catch (error) {
        console.error('Error in getAllLaporan:', error.message)

        if (error.message === 'Orangtua ID tidak ditemukan. Pastikan Anda login sebagai orang tua.') {
            return res.status(401).json({
                status: 'error',
                message: error.message,
                data: null,
            })
        }

        next(error)
    }
}

export const downloadLaporan = async (req, res, next) => {
    try {
        const ortuId = getOrtuId(req)
        const laporanId = parseInt(req.params.id)

        if (isNaN(laporanId)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID laporan tidak valid',
                data: null,
            })
        }

        const laporan = await laporanResmiService.getLaporanByIdService(laporanId, ortuId)

        const projectRoot = path.join(__dirname, '../../..')
        const filePath = path.join(projectRoot, laporan.file_path)
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                status: 'error',
                message: 'File laporan tidak ditemukan',
                data: null,
            })
        }

        const namaSiswa = laporan.nama_siswa.replace(/\s+/g, '_')
        const tahunAjaran = laporan.tahun_ajaran.replace(/\//g, '_')
        const downloadFilename = `Rapor_${namaSiswa}_${tahunAjaran}_${laporan.semester}_v${laporan.version}.pdf`

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`)
        res.setHeader('Content-Length', laporan.file_size)

        const fileStream = fs.createReadStream(filePath)
        fileStream.pipe(res)

        fileStream.on('error', (error) => {
            console.error('Error streaming file:', error)
            if (!res.headersSent) {
                res.status(500).json({
                    status: 'error',
                    message: 'Terjadi kesalahan saat mengunduh file',
                    data: null,
                })
            }
        })
    } catch (error) {
        console.error('Error in downloadLaporan:', error.message)

        if (error.message === 'Orangtua ID tidak ditemukan. Pastikan Anda login sebagai orang tua.') {
            return res.status(401).json({
                status: 'error',
                message: error.message,
                data: null,
            })
        }

        if (error.message === 'Laporan tidak ditemukan') {
            return res.status(404).json({
                status: 'error',
                message: error.message,
                data: null,
            })
        }

        if (error.message === 'Anda tidak memiliki akses untuk mengunduh laporan ini') {
            return res.status(403).json({
                status: 'error',
                message: error.message,
                data: null,
            })
        }

        next(error)
    }
}

export default {
    getAllLaporan,
    downloadLaporan,
}
