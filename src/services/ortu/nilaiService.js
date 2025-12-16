import nilaiModel from '../../models/ortu/nilaiModel.js'

export const getTahunAjaranService = async (siswaId) => {
  try {
    if (!siswaId) {
      throw new Error('Siswa ID tidak ditemukan')
    }

    const tahunAjaranList = await nilaiModel.getTahunAjaranBySiswa(siswaId)

    if (!tahunAjaranList || tahunAjaranList.length === 0) {
      return []
    }

    const formattedData = tahunAjaranList.map((item) => ({
      tahun_ajaran: item.tahun_ajaran,
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
      throw new Error('Tahun ajaran tidak valid')
    }

    const semesterList = await nilaiModel.getSemesterBySiswaAndTahun(siswaId, tahunAjaran)

    if (!semesterList || semesterList.length === 0) {
      return []
    }

    const formattedData = semesterList.map((item) => ({
      tahun_ajaran_id: item.tahun_ajaran_id,
      semester: item.semester,
    }))

    return formattedData
  } catch (error) {
    console.error('Error in getSemesterService:', error)
    throw error
  }
}

export const getNilaiDetailService = async (siswaId, tahunAjaranId, semester) => {
  try {
    if (!siswaId) {
      throw new Error('Siswa ID tidak ditemukan')
    }

    if (!tahunAjaranId || isNaN(tahunAjaranId)) {
      throw new Error('Tahun ajaran ID tidak valid')
    }

    if (!semester || (semester !== 'Ganjil' && semester !== 'Genap')) {
      throw new Error('Semester harus "Ganjil" atau "Genap"')
    }

    const mapelList = await nilaiModel.getAllMapelByKelas(siswaId, tahunAjaranId, semester)

    if (!mapelList || mapelList.length === 0) {
      return []
    }

    const formattedNilai = mapelList.map((item) => {
      return {
        mapel_id: item.mapel_id,
        nama_mapel: item.nama_mapel,
        lm1_tp1: item.lm1_tp1,
        lm1_tp2: item.lm1_tp2,
        lm1_tp3: item.lm1_tp3,
        lm1_tp4: item.lm1_tp4,
        lm2_tp1: item.lm2_tp1,
        lm2_tp2: item.lm2_tp2,
        lm2_tp3: item.lm2_tp3,
        lm2_tp4: item.lm2_tp4,
        lm3_tp1: item.lm3_tp1,
        lm3_tp2: item.lm3_tp2,
        lm3_tp3: item.lm3_tp3,
        lm3_tp4: item.lm3_tp4,
        lm4_tp1: item.lm4_tp1,
        lm4_tp2: item.lm4_tp2,
        lm4_tp3: item.lm4_tp3,
        lm4_tp4: item.lm4_tp4,
        lm5_tp1: item.lm5_tp1,
        lm5_tp2: item.lm5_tp2,
        lm5_tp3: item.lm5_tp3,
        lm5_tp4: item.lm5_tp4,
        lm1_ulangan: item.lm1_ulangan,
        lm2_ulangan: item.lm2_ulangan,
        lm3_ulangan: item.lm3_ulangan,
        lm4_ulangan: item.lm4_ulangan,
        lm5_ulangan: item.lm5_ulangan,
        uts: item.uts,
        uas: item.uas,
        nilai_akhir: item.nilai_akhir,
      }
    })

    return formattedNilai
  } catch (error) {
    console.error('Error in getNilaiDetailService:', error)
    throw error
  }
}

export default {
  getTahunAjaranService,
  getSemesterService,
  getNilaiDetailService,
}
