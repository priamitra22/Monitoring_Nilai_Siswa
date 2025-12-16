import * as laporanModel from '../../models/guru/laporanModel.js'
import puppeteer from 'puppeteer'
import ejs from 'ejs'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


export const getKelasWaliService = async (guruId) => {
  try {
    if (!guruId) {
      throw new Error('Guru ID tidak ditemukan')
    }

    const isWaliKelas = await laporanModel.checkIsWaliKelas(guruId)
    if (!isWaliKelas) {
      throw new Error('Anda tidak memiliki akses sebagai wali kelas')
    }

    const kelasInfo = await laporanModel.getKelasWali(guruId)
    if (!kelasInfo) {
      throw new Error('Anda belum ditugaskan sebagai wali kelas')
    }

    return kelasInfo
  } catch (error) {
    console.error('Error in getKelasWaliService:', error)
    throw error
  }
}


export const getSiswaListService = async (guruId, kelasId) => {
  try {
    if (!guruId) {
      throw new Error('Guru ID tidak ditemukan')
    }

    if (!kelasId) {
      throw new Error('Parameter kelas_id wajib diisi')
    }

    const isWaliKelasOfKelas = await laporanModel.checkIsWaliKelasOfKelas(guruId, kelasId)
    if (!isWaliKelasOfKelas) {
      throw new Error('Anda bukan wali kelas dari kelas ini')
    }


    const siswaList = await laporanModel.getSiswaByKelas(kelasId)

    if (!siswaList || siswaList.length === 0) {
      throw new Error('Tidak ada siswa di kelas ini')
    }

    return siswaList
  } catch (error) {
    console.error('Error in getSiswaListService:', error)
    throw error
  }
}


export const getPerkembanganSiswaService = async (guruId, siswaId) => {
  try {
    if (!guruId) {
      throw new Error('Guru ID tidak ditemukan')
    }

    if (!siswaId) {
      throw new Error('Parameter siswa_id wajib diisi')
    }

    const kelasInfo = await laporanModel.checkIsWaliKelasOfSiswa(guruId, siswaId)
    if (!kelasInfo) {
      throw new Error('Anda bukan wali kelas dari siswa ini')
    }

    const kelasId = kelasInfo.kelas_id

    const siswaDetail = await laporanModel.getSiswaDetail(siswaId)
    if (!siswaDetail) {
      throw new Error('Data siswa tidak ditemukan')
    }

    const nilaiAkademik = await laporanModel.getNilaiAkademikSiswa(siswaId, kelasId)

    const absensi = await laporanModel.getRekapAbsensiSiswa(siswaId)

    const catatanPerkembangan = await laporanModel.getCatatanPerkembanganSiswa(siswaId)

    return {
      siswa: siswaDetail,
      nilai_akademik: nilaiAkademik.map((nilai) => ({
        mapel_id: nilai.mapel_id,
        nama_mapel: nilai.nama_mapel,
        nilai_akhir: nilai.nilai_akhir ? parseFloat(nilai.nilai_akhir) : null,
        grade: nilai.nilai_akhir ? nilai.grade : null,
      })),
      absensi: {
        hadir: parseInt(absensi.hadir) || 0,
        sakit: parseInt(absensi.sakit) || 0,
        izin: parseInt(absensi.izin) || 0,
        alpha: parseInt(absensi.alpha) || 0,
      },
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
          kategori: catatan.kategori,
          jenis: catatan.jenis,
        }
      }),
    }
  } catch (error) {
    console.error('Error in getPerkembanganSiswaService:', error)
    throw error
  }
}


export const generatePDFPerkembanganService = async (guruId, siswaId, catatanWaliKelas) => {
  let browser

  try {
    if (!guruId) {
      throw new Error('Guru ID tidak ditemukan')
    }
    if (!siswaId) {
      throw new Error('Siswa ID wajib diisi')
    }
    if (!catatanWaliKelas || catatanWaliKelas.trim() === '') {
      throw new Error('Catatan wali kelas wajib diisi')
    }

    const perkembanganData = await getPerkembanganSiswaService(guruId, siswaId)

    const guruData = await laporanModel.getGuruById(guruId)
    const guru = {
      nama: guruData.nama_lengkap,
      nip: guruData.nip
    }

    const tahunAjaran = await laporanModel.getTahunAjaranAktif()

    let logoBase64 = ''
    try {
      const logoPath = path.join(process.cwd(), 'assets', 'logo-sekolah.png')
      logoBase64 = fs.readFileSync(logoPath).toString('base64')
    } catch (e) {
      console.warn('Logo tidak ditemukan, menggunakan placeholder.')
    }

    const templateData = {
      siswa: perkembanganData.siswa,
      guru: guru,
      nilai_akademik: perkembanganData.nilai_akademik,
      absensi: perkembanganData.absensi,
      catatan_perkembangan: perkembanganData.catatan_perkembangan,
      catatan_wali_kelas: catatanWaliKelas,
      tahunAjaran: tahunAjaran,
      role: 'guru',
      tanggal_cetak: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      logoBase64: logoBase64,
    }
    const templatePath = path.join(__dirname, '../../views/pdf/laporan-perkembangan.ejs')
    const cssPath = path.join(__dirname, '../../views/pdf/styles/pdf-laporan.css')
    const cssContent = fs.readFileSync(cssPath, 'utf-8')
    templateData.cssContent = cssContent

    const htmlContent = await ejs.renderFile(templatePath, templateData)

    const headerTemplate = `
    <style>
        /* Versi CSS Header yang lebih rapi */
        body { font-family: 'Times New Roman', serif; font-size: 10pt; width: 100%; margin: 0; padding: 0; }
        .kop-surat { 
          display: flex; 
          align-items: center; 
          border-bottom: 3px solid black; 
          padding: 10px 40px; /* Padding atas/bawah dikurangi */
          margin: 0;
        }
        .kop-surat img.logo { width: 70px; height: 70px; margin-right: 20px; }
        .kop-surat .teks-kop { text-align: center; flex-grow: 1; line-height: 1.3; }
        
        /* Dibuat konsisten: H2 paling besar, H3 sedang */
        .kop-surat h2 { font-size: 16pt; margin: 0; font-weight: bold; }
        .kop-surat h3 { font-size: 14pt; margin: 0; font-weight: bold; }
        .kop-surat p { font-size: 9pt; margin: 0; }
        

      </style>
      
      <div class="kop-surat">
        <img src="data:image/png;base64,${logoBase64}" alt="Logo" class="logo">
        <div class="teks-kop">
          <h2>LAPORAN PERKEMBANGAN SISWA</h2>
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
    console.error('Error in generatePDFPerkembanganService:', error)
    if (browser) await browser.close()
    throw error
  }
}

export default {
  getKelasWaliService,
  getSiswaListService,
  getPerkembanganSiswaService,
  generatePDFPerkembanganService,
}
