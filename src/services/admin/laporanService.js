import laporanModel from '../../models/admin/laporanModel.js'
import puppeteer from 'puppeteer'
import ejs from 'ejs'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import archiver from 'archiver'
import { PassThrough } from 'stream'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const getDaftarSiswaService = async (filters) => {
  try {
    const { kelas_id, tahun_ajaran_id, search } = filters

    const siswaList = await laporanModel.getSiswaWithNilai({
      kelas_id,
      tahun_ajaran_id,
      search,
    })

    if (!siswaList || siswaList.length === 0) {
      return []
    }
    return siswaList.map((siswa) => ({
      siswa_id: siswa.siswa_id,
      nama_lengkap: siswa.nama_lengkap,
      nisn: siswa.nisn,
      kelas: siswa.kelas,
      tahun_ajaran: siswa.tahun_ajaran,
      semester: siswa.semester,
      jumlah_mapel_dinilai: Number(siswa.jumlah_mapel_dinilai),
    }))
  } catch (error) {
    console.error('Error in getDaftarSiswaService:', error)
    throw new Error('Gagal mengambil daftar siswa')
  }
}

export const getTranskripNilaiService = async (siswaId) => {
  try {
    const siswaInfo = await laporanModel.getSiswaInfoWithKelas(siswaId)

    if (!siswaInfo) {
      throw new Error('Data siswa tidak ditemukan')
    }

    const nilaiPerSemester = await laporanModel.getNilaiPerSemesterWithId(siswaId)

    const absensiPerSemester = await laporanModel.getAbsensiPerSemester(siswaId)

    const catatanPerSemester = await laporanModel.getCatatanPerSemester(siswaId)

    const riwayatData = {}

    nilaiPerSemester.forEach((nilai) => {
      const key = `ta${nilai.tahun_ajaran_id}-${nilai.semester.toLowerCase()}`

      if (!riwayatData[key]) {
        riwayatData[key] = {
          id: key,
          tahun_ajaran: nilai.tahun_ajaran,
          tahun_ajaran_id: nilai.tahun_ajaran_id,
          semester: nilai.semester,
          kelas: nilai.kelas,
          absensi: {
            hadir: 0,
            sakit: 0,
            izin: 0,
            alpha: 0,
          },
          catatan: [],
          nilai: [],
        }
      }

      riwayatData[key].nilai.push({
        mapel_id: nilai.mapel_id,
        nama_mapel: nilai.mapel,
        nilai_akhir: nilai.nilai_akhir,
        grade: nilai.grade,
        guru_nama: nilai.guru_nama || '-',
      })
    })

    absensiPerSemester.forEach((absensi) => {
      const key = `ta${absensi.tahun_ajaran_id}-${absensi.semester.toLowerCase()}`

      if (riwayatData[key]) {
        riwayatData[key].absensi = {
          hadir: Number(absensi.hadir),
          sakit: Number(absensi.sakit),
          izin: Number(absensi.izin),
          alpha: Number(absensi.alpha),
        }
      }
    })

    catatanPerSemester.forEach((catatan) => {
      const key = `ta${catatan.tahun_ajaran_id}-${catatan.semester.toLowerCase()}`

      if (riwayatData[key]) {
        riwayatData[key].catatan.push({
          kategori: catatan.kategori,
          jenis: catatan.jenis,
          pesan: catatan.pesan,
          guru_nama: catatan.guru_nama,
          mapel: catatan.nama_mapel || '-',
          created_at: catatan.created_at,
        })
      }
    })

    const riwayat_nilai = Object.values(riwayatData).sort((a, b) => {
      if (a.tahun_ajaran !== b.tahun_ajaran) {
        return b.tahun_ajaran.localeCompare(a.tahun_ajaran)
      }
      return a.semester === 'Ganjil' ? -1 : 1
    })

    let formattedTanggalLahir = siswaInfo.tanggal_lahir
    if (siswaInfo.tanggal_lahir) {
      const date = new Date(siswaInfo.tanggal_lahir)
      formattedTanggalLahir = date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }

    return {
      siswa: {
        siswa_id: siswaInfo.siswa_id,
        nama: siswaInfo.nama,
        nisn: siswaInfo.nisn,
        kelas: siswaInfo.kelas,
        tempat_lahir: siswaInfo.tempat_lahir,
        tanggal_lahir: formattedTanggalLahir,
        nama_ortu: siswaInfo.nama_ortu,
        wali_kelas_nama: siswaInfo.wali_kelas_nama,
        wali_kelas_nip: siswaInfo.wali_kelas_nip,
      },
      riwayat_nilai,
    }
  } catch (error) {
    console.error('Error in getTranskripNilaiService:', error)
    throw new Error(error.message || 'Gagal mengambil transkrip nilai siswa')
  }
}

export const generateTranskripPDFService = async (siswaId) => {
  let browser

  try {
    if (!siswaId) {
      throw new Error('Siswa ID wajib diisi')
    }
    const transkripData = await getTranskripNilaiService(siswaId)

    let logoBase64 = ''
    try {
      const logoPath = path.join(process.cwd(), 'assets', 'logo-sekolah.png')
      logoBase64 = fs.readFileSync(logoPath).toString('base64')
    } catch (e) {
      console.warn('Logo tidak ditemukan, menggunakan placeholder.')
    }

    const templateData = {
      role: 'admin',
      siswa: transkripData.siswa,
      riwayat_nilai: transkripData.riwayat_nilai,
      tanggal_cetak: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      logoBase64: logoBase64,
      wali_kelas_nama: transkripData.siswa.wali_kelas_nama || '-',
      wali_kelas_nip: transkripData.siswa.wali_kelas_nip || '-',
      nilai_akademik: [],
      absensi: {},
      catatan_perkembangan: [],
      catatan_wali_kelas: '',
      wali_kelas: '-',
    }

    const templatePath = path.join(
      __dirname,
      '../../views/pdf/transkrip/laporan-transkrip-admin.ejs'
    )
    const cssPath = path.join(__dirname, '../../views/pdf/styles/pdf-transkrip.css')
    const cssContent = fs.readFileSync(cssPath, 'utf-8')

    templateData.cssContent = cssContent

    const htmlContent = await ejs.renderFile(templatePath, templateData)
    const headerTemplate = `
      <style>
        .header-container {
          width: 100%;
          padding: 10px 40px;
          box-sizing: border-box;
          font-family: 'Times New Roman', serif;
        }
        .kop-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 5px;
        }
        .kop-logo-cell {
          width: 100px;
          vertical-align: middle;
          text-align: left;
        }
        .kop-text-cell {
          vertical-align: middle;
          text-align: center;
          padding-right: 100px;
        }
        .kop-logo-img {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }
        .judul-dokumen {
          font-size: 16pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }
        .nama-sekolah {
          font-size: 18pt;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .alamat {
          font-size: 9pt;
          color: #333;
        }
        .kop-separator {
          border-bottom: 4px double #000;
          width: 100%;
          margin-top: 10px;
        }
      </style>
      <div class="header-container">
        <table class="kop-table">
          <tr>
            <td class="kop-logo-cell">
              ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" alt="Logo" class="kop-logo-img" />` : ''}
            </td>
            <td class="kop-text-cell">
              <div class="judul-dokumen">TRANSKRIP NILAI SISWA</div>
              <div class="nama-sekolah">SDN 1 LANGENSARI</div>
              <div class="alamat">
                Jl. Cipanas, Kp. Korobokan, Cimanganten, Kec. Tarogong Kaler, Kabupaten Garut, Jawa Barat 44151
              </div>
            </td>
          </tr>
        </table>
        <div class="kop-separator"></div>
      </div>
    `
    const footerTemplate = `
      <style>
        .footer-container { 
          font-family: 'Times New Roman', serif; 
          font-size: 8pt; 
          width: 100%; 
          padding: 5px 40px;
          box-sizing: border-box;
          border-top: 1px solid #d1d5db;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .footer-left {
          text-align: left;
          color: #6b7280;
        }
        .footer-right {
          text-align: right;
          color: #374151;
        }
      </style>
      <div class="footer-container">
        <div class="footer-left">SDN 1 Langensari | Sistem Monitoring Nilai Siswa</div>
        <div class="footer-right">Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></div>
      </div>
    `

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: headerTemplate,
      footerTemplate: footerTemplate,
      margin: {
        top: '160px',
        bottom: '60px',
        left: '40px',
        right: '40px',
      },
    })

    await browser.close()
    return pdfBuffer
  } catch (error) {
    console.error('Error in generateTranskripPDFService:', error)
    if (browser) await browser.close()
    throw error
  }
}

export const getTahunAjaranDropdownService = async () => {
  try {
    const tahunAjaranList = await laporanModel.getAllTahunAjaran()

    return tahunAjaranList.map((ta) => {
      const semesterLabel = ta.semester === 'Ganjil' ? 'Ganjil' : 'Genap'
      const statusLabel = ta.status === 'aktif' ? ' - Aktif' : ''
      const label = `${ta.tahun} (${semesterLabel})${statusLabel}`

      return {
        id: ta.id,
        tahun: ta.tahun,
        semester: ta.semester,
        label: label,
        is_active: ta.status === 'aktif',
      }
    })
  } catch (error) {
    console.error('Error in getTahunAjaranDropdownService:', error)
    throw new Error('Gagal mengambil daftar tahun ajaran')
  }
}

export const getKelasDropdownService = async (tahunAjaranId) => {
  try {
    if (!tahunAjaranId) {
      throw new Error('Tahun ajaran ID wajib diisi')
    }

    const kelasList = await laporanModel.getKelasByTahunAjaran(tahunAjaranId)

    return kelasList.map((kelas) => ({
      id: kelas.id,
      nama_kelas: kelas.nama_kelas,
    }))
  } catch (error) {
    console.error('Error in getKelasDropdownService:', error)
    throw new Error('Gagal mengambil daftar kelas')
  }
}

export const getSiswaDropdownService = async (kelasId, tahunAjaranId) => {
  try {
    if (!kelasId) {
      throw new Error('Kelas ID wajib diisi')
    }

    if (!tahunAjaranId) {
      throw new Error('Tahun ajaran ID wajib diisi')
    }

    const siswaList = await laporanModel.getSiswaByKelasAndTahun(kelasId, tahunAjaranId)

    return siswaList.map((siswa) => ({
      id: siswa.id,
      nama: siswa.nama,
      nisn: siswa.nisn,
      label: `${siswa.nama} - ${siswa.nisn}`,
    }))
  } catch (error) {
    console.error('Error in getSiswaDropdownService:', error)
    throw new Error('Gagal mengambil daftar siswa')
  }
}

export const generateBulkTranskripService = async (kelasId, tahunAjaranId) => {
  try {
    if (!kelasId) {
      throw new Error('Kelas ID wajib diisi')
    }

    if (!tahunAjaranId) {
      throw new Error('Tahun ajaran ID wajib diisi')
    }

    const kelasInfo = await laporanModel.getKelasInfo(kelasId)
    if (!kelasInfo) {
      throw new Error('Kelas tidak ditemukan')
    }

    const siswaIds = await laporanModel.getAllSiswaIdsByKelas(kelasId, tahunAjaranId)

    if (!siswaIds || siswaIds.length === 0) {
      throw new Error('Tidak ada siswa di kelas ini')
    }

    const bufferStream = new PassThrough()
    const chunks = []

    bufferStream.on('data', (chunk) => {
      chunks.push(chunk)
    })

    const archive = archiver('zip', {
      zlib: { level: 9 },
    })

    archive.pipe(bufferStream)

    archive.on('error', (err) => {
      throw err
    })
    for (const siswa of siswaIds) {
      try {
        const pdfData = await generateTranskripPDFService(siswa.siswa_id)

        const pdfBuffer = Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData)

        const transkripData = await getTranskripNilaiService(siswa.siswa_id)
        const siswaName = transkripData.siswa.nama.replace(/\s+/g, '_')
        const siswaNisn = transkripData.siswa.nisn

        const filename = `Transkrip_${siswaName}_${siswaNisn}.pdf`

        archive.append(pdfBuffer, { name: filename })
      } catch (error) {
        console.error(`Error generating PDF for siswa ${siswa.siswa_id}:`, error)
      }
    }

    archive.finalize()

    await new Promise((resolve, reject) => {
      bufferStream.on('end', resolve)
      bufferStream.on('error', reject)
    })

    const zipBuffer = Buffer.concat(chunks)

    const kelasName = kelasInfo.nama_kelas.replace(/\s+/g, '_')
    const tahunAjaran = kelasInfo.tahun_ajaran.replace(/\//g, '-')
    const zipFilename = `Transkrip_${kelasName}_${tahunAjaran}.zip`

    return {
      buffer: zipBuffer,
      filename: zipFilename,
      totalSiswa: siswaIds.length,
    }
  } catch (error) {
    console.error('Error in generateBulkTranskripService:', error)
    throw error
  }
}

export default {
  getDaftarSiswaService,
  getTranskripNilaiService,
  generateTranskripPDFService,
  getTahunAjaranDropdownService,
  getKelasDropdownService,
  getSiswaDropdownService,
  generateBulkTranskripService,
}
