import absensiModel from '../../models/ortu/absensiModel.js'

export const getTahunAjaranService = async (siswaId) => {
  try {
    if (!siswaId) {
      throw new Error('Siswa ID tidak ditemukan')
    }
    const tahunAjaranList = await absensiModel.getTahunAjaranBySiswa(siswaId)

    if (!tahunAjaranList || tahunAjaranList.length === 0) {
      return []
    }
    const formattedData = tahunAjaranList.map((item) => ({
      tahun: item.tahun,
    }))

    return formattedData
  } catch (error) {
    console.error('Error in getTahunAjaranService:', error)
    throw error
  }
}

export const getSemesterService = async (siswaId, tahunAjaran) => {
  try {
    if (!siswaId) {
      throw new Error('Siswa ID tidak ditemukan')
    }
    if (!tahunAjaran) {
      throw new Error('Tahun ajaran tidak ditemukan')
    }
    const semesterList = await absensiModel.getSemesterByTahunAjaran(siswaId, tahunAjaran)

    if (!semesterList || semesterList.length === 0) {
      return []
    }

    const today = new Date().toISOString().split('T')[0]

    const formattedData = semesterList
      .filter((item) => item.has_data > 0)
      .map((item) => {
        const isAktif =
          today >= item.tanggal_mulai && today <= item.tanggal_selesai ? 'aktif' : 'tidak-aktif'
        const namaSemester =
          item.semester === 'Ganjil' ? 'Semester 1 (Ganjil)' : 'Semester 2 (Genap)'
        const valueSemester = item.semester === 'Ganjil' ? '1' : '2'

        return {
          id: item.id,
          nama: namaSemester,
          value: valueSemester,
          status: isAktif,
          tanggal_mulai: item.tanggal_mulai,
          tanggal_selesai: item.tanggal_selesai,
          has_data: true,
        }
      })

    return formattedData
  } catch (error) {
    console.error('Error in getSemesterService:', error)
    throw error
  }
}

export const getBulanService = async (siswaId, tahunAjaranId, semester) => {
  try {
    if (!siswaId) {
      throw new Error('Siswa ID tidak ditemukan')
    }
    if (!tahunAjaranId) {
      throw new Error('Tahun ajaran ID tidak ditemukan')
    }
    if (!semester) {
      throw new Error('Semester tidak ditemukan')
    }

    const semesterInfo = await absensiModel.getSemesterInfo(tahunAjaranId, semester)

    if (!semesterInfo) {
      return null
    }

    const tanggalMulai = new Date(semesterInfo.tanggal_mulai)
    const tanggalSelesai = new Date(semesterInfo.tanggal_selesai)

    const bulanList = []
    const currentDate = new Date(tanggalMulai)

    const namaBulan = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ]

    while (
      currentDate.getFullYear() < tanggalSelesai.getFullYear() ||
      (currentDate.getFullYear() === tanggalSelesai.getFullYear() &&
        currentDate.getMonth() <= tanggalSelesai.getMonth())
    ) {
      const tahun = currentDate.getFullYear()
      const bulan = currentDate.getMonth() + 1
      const bulanStr = bulan.toString().padStart(2, '0')

      const firstDayOfMonth = new Date(tahun, bulan - 1, 1)
      const lastDayOfMonth = new Date(tahun, bulan, 0)

      const startDate = firstDayOfMonth < tanggalMulai ? tanggalMulai : firstDayOfMonth
      const endDate = lastDayOfMonth > tanggalSelesai ? tanggalSelesai : lastDayOfMonth

      const diffTime = Math.abs(endDate - startDate)
      const jumlahHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

      const hasData = await absensiModel.checkAbsensiByMonth(siswaId, tahun, bulan)

      bulanList.push({
        value: bulanStr,
        label: `${namaBulan[bulan - 1]} ${tahun}`,
        tahun: tahun,
        has_data: hasData > 0,
        jumlah_hari: jumlahHari,
      })

      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    return {
      semester_info: {
        semester: semester,
        nama: semester === '1' ? 'Semester 1 (Ganjil)' : 'Semester 2 (Genap)',
        tanggal_mulai: semesterInfo.tanggal_mulai,
        tanggal_selesai: semesterInfo.tanggal_selesai,
      },
      bulan: bulanList,
    }
  } catch (error) {
    console.error('Error in getBulanService:', error)
    throw error
  }
}

export const getSummaryService = async (siswaId, tahunAjaranId, semester) => {
  try {
    if (!siswaId) {
      throw new Error('Siswa ID tidak ditemukan')
    }
    if (!tahunAjaranId) {
      throw new Error('Tahun ajaran ID tidak ditemukan')
    }
    if (!semester) {
      throw new Error('Semester tidak ditemukan')
    }

    const semesterInfo = await absensiModel.getSemesterInfo(tahunAjaranId, semester)

    if (!semesterInfo) {
      return null
    }

    const summaryData = await absensiModel.getAbsensiSummaryBySemester(
      siswaId,
      semesterInfo.tanggal_mulai,
      semesterInfo.tanggal_selesai
    )

    const summary = {
      total_hadir: summaryData.total_hadir || 0,
      total_sakit: summaryData.total_sakit || 0,
      total_izin: summaryData.total_izin || 0,
      total_alpha: summaryData.total_alpha || 0,
      total_hari: summaryData.total_hari || 0,
      persentase_hadir:
        summaryData.total_hari > 0
          ? parseFloat(((summaryData.total_hadir / summaryData.total_hari) * 100).toFixed(2))
          : 0,
    }

    const tahunAjaranInfo = await absensiModel.getTahunAjaranInfo(tahunAjaranId)

    return {
      summary: summary,
      periode: {
        tahun_ajaran: tahunAjaranInfo ? tahunAjaranInfo.tahun : '-',
        semester: semester === '1' ? 'Semester 1 (Ganjil)' : 'Semester 2 (Genap)',
        tanggal_mulai: semesterInfo.tanggal_mulai,
        tanggal_selesai: semesterInfo.tanggal_selesai,
      },
    }
  } catch (error) {
    console.error('Error in getSummaryService:', error)
    throw error
  }
}

export const getDetailService = async (siswaId, tahunAjaranId, semester, bulan = null) => {
  try {
    if (!siswaId || !tahunAjaranId || !semester) {
      throw new Error('Parameter tidak lengkap')
    }
    const semesterInfo = await absensiModel.getSemesterInfo(tahunAjaranId, semester)

    if (!semesterInfo) {
      return null
    }

    const absensiList = await absensiModel.getDetailAbsensi(
      siswaId,
      semesterInfo.tanggal_mulai,
      semesterInfo.tanggal_selesai,
      bulan
    )

    if (!absensiList || absensiList.length === 0) {
      return null
    }

    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

    const formattedData = absensiList.map((item) => {
      const tanggalObj = new Date(item.tanggal)
      const hariIndex = tanggalObj.getDay()

      return {
        id: item.id,
        tanggal: item.tanggal,
        hari: namaHari[hariIndex],
        status: item.status,
        guru_id: item.guru_id,
        guru_nama: item.guru_nama,
        kelas_id: item.kelas_id,
        kelas_nama: item.kelas_nama,
      }
    })

    const tahunAjaranInfo = await absensiModel.getTahunAjaranInfo(tahunAjaranId)

    let bulanLabel = 'Semua Bulan'
    if (bulan) {
      const namaBulan = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
      ]
      const bulanIndex = parseInt(bulan) - 1
      const tahunBulan =
        formattedData.length > 0
          ? new Date(formattedData[0].tanggal).getFullYear()
          : new Date().getFullYear()
      bulanLabel = `${namaBulan[bulanIndex]} ${tahunBulan}`
    }

    return {
      absensi: formattedData,
      meta: {
        total: formattedData.length,
        periode: {
          tahun_ajaran: tahunAjaranInfo ? tahunAjaranInfo.tahun : '-',
          semester: semester === '1' ? 'Semester 1 (Ganjil)' : 'Semester 2 (Genap)',
          bulan: bulanLabel,
        },
      },
    }
  } catch (error) {
    console.error('Error in getDetailService:', error)
    throw error
  }
}

export default {
  getTahunAjaranService,
  getSemesterService,
  getBulanService,
  getSummaryService,
  getDetailService,
}
