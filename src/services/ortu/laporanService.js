import * as laporanModel from '../../models/ortu/laporanModel.js'
import puppeteer from 'puppeteer'
import ejs from 'ejs'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const calculateNilaiAkhir = (row) => {
  const komponenFormatif = [
    row.lm1_tp1,
    row.lm1_tp2,
    row.lm1_tp3,
    row.lm1_tp4,
    row.lm2_tp1,
    row.lm2_tp2,
    row.lm2_tp3,
    row.lm2_tp4,
    row.lm3_tp1,
    row.lm3_tp2,
    row.lm3_tp3,
    row.lm3_tp4,
    row.lm4_tp1,
    row.lm4_tp2,
    row.lm4_tp3,
    row.lm4_tp4,
    row.lm5_tp1,
    row.lm5_tp2,
    row.lm5_tp3,
    row.lm5_tp4,
  ].filter((val) => val !== null && val !== undefined)

  const komponenSumatif = [
    row.lm1_ulangan,
    row.lm2_ulangan,
    row.lm3_ulangan,
    row.lm4_ulangan,
    row.lm5_ulangan,
  ].filter((val) => val !== null && val !== undefined)

  const avgFormatif =
    komponenFormatif.length > 0
      ? komponenFormatif.reduce((a, b) => a + b, 0) / komponenFormatif.length
      : 0

  const avgSumatif =
    komponenSumatif.length > 0
      ? komponenSumatif.reduce((a, b) => a + b, 0) / komponenSumatif.length
      : 0

  const uts = row.uts || 0
  const uas = row.uas || 0

  if (komponenFormatif.length === 0 && komponenSumatif.length === 0 && uts === 0 && uas === 0) {
    return 0
  }
  const nilaiAkhir = avgFormatif * 0.4 + avgSumatif * 0.2 + uts * 0.2 + uas * 0.2

  return Math.round(nilaiAkhir * 100) / 100
}

export const getTahunAjaranService = async (siswaId) => {
  try {
    const tahunAjaranList = await laporanModel.getTahunAjaranListBySiswa(siswaId)

    return tahunAjaranList.map((ta) => ({
      tahun_ajaran: ta.tahun_ajaran,
      is_active: ta.is_active === 1 || ta.is_active === true,
    }))
  } catch (error) {
    console.error('Error in getTahunAjaranService:', error)
    throw error
  }
}

export const getSemesterService = async (siswaId, tahunAjaran) => {
  try {
    if (!siswaId) {
      throw new Error('Data siswa tidak ditemukan dalam token')
    }

    if (!tahunAjaran) {
      throw new Error('Tahun ajaran wajib dipilih')
    }

    const semesterList = await laporanModel.getSemesterListBySiswa(siswaId, tahunAjaran)

    return semesterList.map((sem) => {
      let semesterValue = sem.semester
      if (sem.semester === 'Ganjil') {
        semesterValue = '1'
      } else if (sem.semester === 'Genap') {
        semesterValue = '2'
      }

      return {
        tahun_ajaran_id: sem.tahun_ajaran_id,
        semester: semesterValue,
        label: sem.label,
      }
    })
  } catch (error) {
    console.error('Error in getSemesterService:', error)
    throw error
  }
}

export const getNilaiLaporanService = async (siswaId, tahunAjaranId, semester) => {
  try {
    if (!siswaId) {
      throw new Error('Data siswa tidak ditemukan dalam token')
    }

    if (!tahunAjaranId) {
      throw new Error('Tahun ajaran wajib dipilih')
    }
    if (!semester) {
      throw new Error('Semester wajib diisi')
    }

    let normalizedSemester = semester
    if (semester === '1' || semester === 1) {
      normalizedSemester = 'Ganjil'
    } else if (semester === '2' || semester === 2) {
      normalizedSemester = 'Genap'
    } else if (semester !== 'Ganjil' && semester !== 'Genap') {
      throw new Error('Semester harus 1 atau 2 (atau Ganjil/Genap)')
    }

    const nilaiData = await laporanModel.getNilaiBySiswaId(
      siswaId,
      tahunAjaranId,
      normalizedSemester
    )

    if (!nilaiData || nilaiData.length === 0) {
      throw new Error('Data nilai tidak ditemukan untuk siswa ini')
    }
    const siswaInfo = {
      siswa_id: nilaiData[0].siswa_id,
      siswa_nama: nilaiData[0].siswa_nama,
      nisn: nilaiData[0].nisn,
      kelas_nama: nilaiData[0].kelas_nama,
      tahun_ajaran: nilaiData[0].tahun_ajaran,
      semester: nilaiData[0].semester,
    }

    const nilaiArray = nilaiData.map((row) => {
      const nilaiAkhir =
        row.nilai_akhir !== null && row.nilai_akhir !== undefined ? row.nilai_akhir : null

      return {
        nilai_id: row.nilai_id,
        nama_mapel: row.nama_mapel,
        nilai_akhir: nilaiAkhir,
        guru_nama: row.guru_nama,
      }
    })

    const nilaiAkhirValues = nilaiArray
      .map((n) => n.nilai_akhir)
      .filter((v) => v !== null && v !== undefined && v > 0)

    const calculatedStatistik = {
      total_mapel: nilaiArray.length,
      mapel_dengan_nilai: nilaiAkhirValues.length,
      rata_rata:
        nilaiAkhirValues.length > 0
          ? (nilaiAkhirValues.reduce((a, b) => a + b, 0) / nilaiAkhirValues.length).toFixed(2)
          : '0.00',
      nilai_tertinggi: nilaiAkhirValues.length > 0 ? Math.max(...nilaiAkhirValues) : 0,
      nilai_terendah: nilaiAkhirValues.length > 0 ? Math.min(...nilaiAkhirValues) : 0,
      tuntas: nilaiAkhirValues.filter((v) => v >= 75).length,
      belum_tuntas: nilaiAkhirValues.filter((v) => v < 75).length,
    }

    return {
      siswa: siswaInfo,
      nilai: nilaiArray,
      statistik: calculatedStatistik,
      catatan_perkembangan: [],
      absensi: {},
    }
  } catch (error) {
    console.error('Error in getNilaiLaporanService:', error)
    throw error
  }
}

export const generatePDFLaporanService = async (siswaId, tahunAjaranId, semester) => {
  let browser

  try {
    if (!semester) {
      throw new Error('Semester wajib diisi')
    }
    let normalizedSemester = semester
    if (semester === '1' || semester === 1) {
      normalizedSemester = 'Ganjil'
    } else if (semester === '2' || semester === 2) {
      normalizedSemester = 'Genap'
    }

    const laporanData = await getNilaiLaporanService(siswaId, tahunAjaranId, semester)

    const guruWaliKelas = await laporanModel.getGuruWaliKelasBySiswa(siswaId)
    const catatanPerkembangan = await laporanModel.getCatatanPerkembanganBySiswa(
      siswaId,
      tahunAjaranId,
      normalizedSemester
    )
    const absensi = await laporanModel.getRekapAbsensiBySiswa(
      siswaId,
      tahunAjaranId,
      normalizedSemester
    )

    const siswaDetail = laporanData.siswa
    let logoBase64 = ''
    try {
      const logoPath = path.join(process.cwd(), 'assets', 'logo-sekolah.png')
      logoBase64 = fs.readFileSync(logoPath).toString('base64')
    } catch (e) {
      console.warn('Logo tidak ditemukan, menggunakan placeholder.')
    }

    const templateData = {
      role: 'ortu',
      siswa: {
        nama: siswaDetail.siswa_nama,
        nisn: siswaDetail.nisn,
      },
      kelas: siswaDetail.kelas_nama,
      wali_kelas: guruWaliKelas ? guruWaliKelas.nama : '-',
      tahunAjaran: siswaDetail.tahun_ajaran,
      semester: siswaDetail.semester,
      guru: guruWaliKelas ? {
        nama: guruWaliKelas.nama,
        nip: guruWaliKelas.nip || '-'
      } : null,
      nilai_akademik: laporanData.nilai.map((nilai) => ({
        nama_mapel: nilai.nama_mapel,
        nilai_akhir: nilai.nilai_akhir !== null ? parseFloat(nilai.nilai_akhir) : null,
        grade: nilai.nilai_akhir ? getGrade(nilai.nilai_akhir) : '-',
        guru_nama: nilai.guru_nama || '-',
      })),
      catatan_perkembangan: catatanPerkembangan.map((catatan) => {
        const tanggalObj = new Date(catatan.tanggal)
        const tanggalFormatted = !isNaN(tanggalObj.getTime())
          ? tanggalObj.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
          : catatan.tanggal.split('T')[0].split('-').reverse().join('/')

        return {
          tanggal: catatan.tanggal,
          tanggal_formatted: tanggalFormatted,
          guru_nama: catatan.guru_nama,
          isi_catatan: catatan.isi_catatan,
          kategori: catatan.kategori || 'Netral',
          jenis: catatan.jenis || 'Umum',
        }
      }),
      absensi: {
        hadir: parseInt(absensi.hadir) || 0,
        sakit: parseInt(absensi.sakit) || 0,
        izin: parseInt(absensi.izin) || 0,
        alpha: parseInt(absensi.alpha) || 0,
      },
      tanggal_cetak: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      logoBase64: logoBase64,
    }

    const templatePath = path.join(__dirname, '../../views/pdf/laporan-nilai-ortu.ejs')
    const cssPath = path.join(__dirname, '../../views/pdf/styles/pdf-laporan.css')
    const cssContent = fs.readFileSync(cssPath, 'utf-8')

    templateData.cssContent = cssContent

    const htmlContent = await ejs.renderFile(templatePath, templateData)

    const headerTemplate = `
    <style>
        body { font-family: 'Times New Roman', serif; font-size: 10pt; width: 100%; margin: 0; padding: 0; }
        .kop-surat { 
          display: flex; 
          align-items: center; 
          border-bottom: 3px solid black; 
          padding: 10px 40px;
          margin: 0;
        }
        .kop-surat img.logo { width: 70px; height: 70px; margin-right: 20px; }
        .kop-surat .teks-kop { text-align: center; flex-grow: 1; line-height: 1.3; }
        .kop-surat h2 { font-size: 16pt; margin: 0; font-weight: bold; }
        .kop-surat h3 { font-size: 14pt; margin: 0; font-weight: bold; }
        .kop-surat p { font-size: 9pt; margin: 0; }
      </style>
      
      <div class="kop-surat">
        <img src="data:image/png;base64,${logoBase64}" alt="Logo" class="logo">
        <div class="teks-kop">
          <h2>LAPORAN NILAI SISWA</h2>
          <h3>SDN 1 LANGENSARI</h3>
          <p>Jl. Cipanas, Kp. Korobokan, Cimanganten, Kec. Tarogong Kaler, Kabupaten Garut, Jawa Barat 44151</p>
        </div>
      </div>
    `

    const footerTemplate = `
      <style>
        div { 
          font-family: 'Times New Roman', serif; 
          font-size: 9pt; 
          width: 100%; 
          text-align: right; 
          padding: 0 40px;
          box-sizing: border-box;
        }
      </style>
      <div>
        Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span>
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
        top: '140px',
        bottom: '60px',
        left: '40px',
        right: '40px',
      },
    })

    await browser.close()
    return pdfBuffer
  } catch (error) {
    console.error('Error in generatePDFLaporanService:', error)
    if (browser) await browser.close()
    throw error
  }
}


const getGrade = (nilaiAkhir) => {
  if (nilaiAkhir >= 90) return 'A'
  if (nilaiAkhir >= 80) return 'B'
  if (nilaiAkhir >= 70) return 'C'
  if (nilaiAkhir >= 60) return 'D'
  return 'E'
}

export default {
  getTahunAjaranService,
  getNilaiLaporanService,
  generatePDFLaporanService,
}
