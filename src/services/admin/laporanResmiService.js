import {
    getAllLaporanResmi,
    getLaporanResmiStatistics,
    getLaporanResmiById,
    getVersionHistory,
    checkExistingLaporan,
    getLatestVersion,
    setOldVersionNotLatest,
    createLaporanResmi,
    updateLaporanResmi,
    deleteLaporanResmi,
    setPreviousVersionAsLatest,
    validateSiswaInKelas,
    getSiswaNameById,
} from '../../models/admin/laporanResmiModel.js'
import { generateLaporanFilename, deleteFile } from '../../config/multerConfig.js'
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinaryConfig.js'
import fs from 'fs'
import path from 'path'

const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

export const fetchAllLaporanResmi = async (
    page = 1,
    limit = 10,
    search = '',
    tahunAjaranId = '',
    kelasId = '',
    semester = '',
    sortBy = 'upload_date',
    sortOrder = 'desc'
) => {
    try {
        const pageNum = parseInt(page)
        const limitNum = parseInt(limit)

        if (isNaN(pageNum) || pageNum < 1) {
            return {
                status: 'error',
                message: 'Halaman harus berupa angka positif',
                data: null,
            }
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return {
                status: 'error',
                message: 'Limit harus berupa angka antara 1-100',
                data: null,
            }
        }

        const [laporanResult, statistics] = await Promise.all([
            getAllLaporanResmi(
                pageNum,
                limitNum,
                search,
                tahunAjaranId,
                kelasId,
                semester,
                sortBy,
                sortOrder
            ),
            getLaporanResmiStatistics(),
        ])

        if (!laporanResult.data || laporanResult.data.length === 0) {
            return {
                status: 'success',
                message: 'Tidak ada data laporan',
                data: {
                    laporan: [],
                    pagination: laporanResult.pagination,
                    statistics,
                },
            }
        }

        return {
            status: 'success',
            message: 'Data laporan berhasil diambil',
            data: {
                laporan: laporanResult.data,
                pagination: laporanResult.pagination,
                statistics,
            },
        }
    } catch (error) {
        console.error('Error in fetchAllLaporanResmi:', error)
        return {
            status: 'error',
            message: 'Gagal mengambil data laporan',
            data: null,
        }
    }
}

export const fetchLaporanResmiDetail = async (id) => {
    try {
        if (!id || isNaN(id)) {
            return {
                status: 'error',
                message: 'ID laporan tidak valid',
                data: null,
            }
        }

        const laporan = await getLaporanResmiById(id)

        if (!laporan) {
            return {
                status: 'error',
                message: 'Laporan tidak ditemukan',
                data: null,
            }
        }

        return {
            status: 'success',
            message: 'Detail laporan berhasil diambil',
            data: laporan,
        }
    } catch (error) {
        console.error('Error in fetchLaporanResmiDetail:', error)
        return {
            status: 'error',
            message: 'Gagal mengambil detail laporan',
            data: null,
        }
    }
}


export const fetchVersionHistory = async (siswaId) => {
    try {
        if (!siswaId) {
            return {
                status: 'error',
                message: 'Siswa ID tidak ditemukan',
                data: null,
            }
        }

        const siswaName = await getSiswaNameById(siswaId)
        if (!siswaName) {
            return {
                status: 'error',
                message: 'Siswa tidak ditemukan',
                data: null,
            }
        }

        const versions = await getVersionHistory(siswaId)

        if (versions.length === 0) {
            return {
                status: 'success',
                message: 'Tidak ada riwayat versi',
                data: {
                    siswa_id: siswaId,
                    nama_siswa: siswaName,
                    versions: [],
                },
            }
        }

        return {
            status: 'success',
            message: 'Riwayat versi berhasil diambil',
            data: {
                siswa_id: siswaId,
                nama_siswa: siswaName,
                versions,
            },
        }
    } catch (error) {
        console.error('Error in fetchVersionHistory:', error)
        return {
            status: 'error',
            message: 'Gagal mengambil riwayat versi',
            data: null,
        }
    }
}

export const uploadLaporanResmi = async (data, file, userId) => {
    try {
        if (!data.tahun_ajaran_id || !data.kelas_id || !data.siswa_id || !data.semester) {
            if (file) {
                await cleanupTempFile(file.path)
            }
            return {
                status: 'error',
                message: 'Data tidak lengkap',
                errors: {
                    tahun_ajaran_id: !data.tahun_ajaran_id ? 'Tahun ajaran harus dipilih' : null,
                    kelas_id: !data.kelas_id ? 'Kelas harus dipilih' : null,
                    siswa_id: !data.siswa_id ? 'Siswa harus dipilih' : null,
                    semester: !data.semester ? 'Semester harus dipilih' : null,
                },
            }
        }

        if (!file) {
            return {
                status: 'error',
                message: 'File laporan harus diupload',
                errors: {
                    file: 'File laporan wajib diupload',
                },
            }
        }

        if (!['Ganjil', 'Genap'].includes(data.semester)) {
            await cleanupTempFile(file.path)
            return {
                status: 'error',
                message: 'Semester tidak valid',
                errors: {
                    semester: 'Semester harus Ganjil atau Genap',
                },
            }
        }

        const isValidSiswa = await validateSiswaInKelas(data.siswa_id, data.kelas_id)
        if (!isValidSiswa) {
            await cleanupTempFile(file.path)
            return {
                status: 'error',
                message: 'Siswa tidak terdaftar di kelas yang dipilih',
                errors: {
                    siswa_id: 'Siswa tidak terdaftar di kelas yang dipilih',
                },
            }
        }

        const existingLaporan = await checkExistingLaporan(data.siswa_id)

        let version = 1
        let isUpdate = false

        if (existingLaporan) {
            const latestVersion = await getLatestVersion(data.siswa_id)
            version = latestVersion + 1
            isUpdate = true
            await setOldVersionNotLatest(data.siswa_id)
        }

        const siswaName = await getSiswaNameById(data.siswa_id)
        const newFilename = generateLaporanFilename(data.siswa_id, version, siswaName)

        let filePath = ''
        let cloudinaryPublicId = null

        if (useCloudinary) {
            const cloudinaryResult = await uploadToCloudinary(file.path, {
                folder: 'laporan_resmi',
                public_id: newFilename.replace('.pdf', ''),
                resource_type: 'raw'
            })

            if (!cloudinaryResult.success) {
                await cleanupTempFile(file.path)
                return {
                    status: 'error',
                    message: 'Gagal mengupload file ke cloud storage',
                    data: null,
                }
            }

            filePath = cloudinaryResult.url
            cloudinaryPublicId = cloudinaryResult.public_id

            await cleanupTempFile(file.path)
        } else {
            const localFilePath = `uploads/laporan_resmi/${newFilename}`
            const fullLocalPath = path.join(process.cwd(), localFilePath)

            const dir = path.dirname(fullLocalPath)
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
            }

            fs.renameSync(file.path, fullLocalPath)
            filePath = localFilePath
        }

        const laporanData = {
            siswa_id: data.siswa_id,
            kelas_id: data.kelas_id,
            tahun_ajaran_id: data.tahun_ajaran_id,
            semester: data.semester,
            file_path: filePath,
            original_filename: file.originalname,
            file_size: file.size,
            version,
            is_latest: true,
            uploaded_by: userId,
            keterangan: data.keterangan || null,
        }

        const result = await createLaporanResmi(laporanData)

        return {
            status: 'success',
            message: isUpdate
                ? `Laporan berhasil diupload sebagai versi ${version}`
                : 'Laporan berhasil diupload',
            data: {
                id: result.id,
                siswa_id: data.siswa_id,
                nama_siswa: siswaName,
                version,
                file_path: filePath,
                is_latest: true,
                is_update: isUpdate,
                previous_version: isUpdate ? version - 1 : null,
                storage: useCloudinary ? 'cloudinary' : 'local'
            },
        }
    } catch (error) {
        console.error('Error in uploadLaporanResmi:', error)

        if (file) {
            await cleanupTempFile(file.path)
        }

        return {
            status: 'error',
            message: 'Gagal mengupload laporan',
            data: null,
        }
    }
}

export const updateLaporanResmiService = async (id, file, keterangan, userId) => {
    try {
        const existingLaporan = await getLaporanResmiById(id)

        if (!existingLaporan) {
            if (file) {
                await cleanupTempFile(file.path)
            }
            return {
                status: 'error',
                message: 'Laporan tidak ditemukan',
                data: null,
            }
        }

        if (!file) {
            return {
                status: 'error',
                message: 'File laporan harus diupload',
                errors: {
                    file: 'File laporan wajib diupload',
                },
            }
        }

        const latestVersion = await getLatestVersion(
            existingLaporan.siswa_id,
            existingLaporan.tahun_ajaran_id,
            existingLaporan.semester
        )
        const newVersion = latestVersion + 1

        await setOldVersionNotLatest(
            existingLaporan.siswa_id,
            existingLaporan.tahun_ajaran_id,
            existingLaporan.semester
        )

        const newFilename = generateLaporanFilename(
            existingLaporan.siswa_id,
            newVersion,
            existingLaporan.nama_siswa
        )

        let filePath = ''
        let cloudinaryPublicId = null

        if (useCloudinary) {
            const cloudinaryResult = await uploadToCloudinary(file.path, {
                folder: 'laporan_resmi',
                public_id: newFilename.replace('.pdf', ''),
                resource_type: 'raw'
            })

            if (!cloudinaryResult.success) {
                await cleanupTempFile(file.path)
                return {
                    status: 'error',
                    message: 'Gagal mengupload file ke cloud storage',
                    data: null,
                }
            }

            filePath = cloudinaryResult.url
            cloudinaryPublicId = cloudinaryResult.public_id

            await cleanupTempFile(file.path)
        } else {
            const localFilePath = `uploads/laporan_resmi/${newFilename}`
            const fullLocalPath = path.join(process.cwd(), localFilePath)

            const dir = path.dirname(fullLocalPath)
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
            }

            fs.renameSync(file.path, fullLocalPath)
            filePath = localFilePath
        }

        const laporanData = {
            siswa_id: existingLaporan.siswa_id,
            kelas_id: existingLaporan.kelas_id,
            tahun_ajaran_id: existingLaporan.tahun_ajaran_id,
            semester: existingLaporan.semester,
            file_path: filePath,
            original_filename: file.originalname,
            file_size: file.size,
            version: newVersion,
            is_latest: true,
            uploaded_by: userId,
            keterangan: keterangan || null,
        }

        const result = await createLaporanResmi(laporanData)

        return {
            status: 'success',
            message: `Laporan berhasil diupdate ke versi ${newVersion}`,
            data: {
                id: result.id,
                siswa_id: existingLaporan.siswa_id,
                nama_siswa: existingLaporan.nama_siswa,
                version: newVersion,
                file_path: filePath,
                is_latest: true,
                previous_version: latestVersion,
                storage: useCloudinary ? 'cloudinary' : 'local'
            },
        }
    } catch (error) {
        console.error('Error in updateLaporanResmiService:', error)

        if (file) {
            await cleanupTempFile(file.path)
        }

        return {
            status: 'error',
            message: 'Gagal mengupdate laporan',
            data: null,
        }
    }
}

export const deleteLaporanResmiService = async (id) => {
    try {
        const result = await deleteLaporanResmi(id)

        if (!result) {
            return {
                status: 'error',
                message: 'Laporan tidak ditemukan',
                data: null,
            }
        }

        const { deletedLaporan } = result

        try {
            if (deletedLaporan.file_path.includes('cloudinary') || deletedLaporan.file_path.includes('res.cloudinary.com')) {
                const publicId = extractPublicIdFromUrl(deletedLaporan.file_path)
                if (publicId) {
                    await deleteFromCloudinary(publicId)
                }
            } else {
                await deleteFile(deletedLaporan.file_path)
            }
        } catch (fileError) {
            console.error('Error deleting file:', fileError)
        }

        if (deletedLaporan.is_latest && deletedLaporan.version > 1) {
            await setPreviousVersionAsLatest(deletedLaporan.siswa_id, deletedLaporan.version)
        }

        return {
            status: 'success',
            message: 'Laporan berhasil dihapus',
            data: {
                deleted_id: id,
                was_latest: deletedLaporan.is_latest,
                version: deletedLaporan.version,
            },
        }
    } catch (error) {
        console.error('Error in deleteLaporanResmiService:', error)
        return {
            status: 'error',
            message: 'Gagal menghapus laporan',
            data: null,
        }
    }
}

async function cleanupTempFile(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }
    } catch (error) {
        console.error('Error cleaning up temp file:', error)
    }
}

function extractPublicIdFromUrl(url) {
    try {
        const match = url.match(/\/upload\/v\d+\/(.+)$/)
        if (match) {
            return match[1].replace('.pdf', '')
        }
        return null
    } catch (error) {
        return null
    }
}
