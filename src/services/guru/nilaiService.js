import * as nilaiModel from '../../models/guru/nilaiModel.js';

export const getKelasDropdownService = async (guruId) => {
  try {
    const kelasList = await nilaiModel.getKelasByGuru(guruId);

    return kelasList;
  } catch (error) {
    console.error('Error in getKelasDropdownService:', error);
    throw error;
  }
};

export const getMapelDropdownService = async (guruId, kelasId) => {
  try {
    if (!kelasId) {
      throw new Error('Parameter kelas_id wajib diisi');
    }

    const mapelList = await nilaiModel.getMapelByGuruAndKelas(guruId, kelasId);

    if (mapelList.length === 0) {
      throw new Error('Anda tidak mengampu mata pelajaran di kelas ini');
    }

    return mapelList;
  } catch (error) {
    console.error('Error in getMapelDropdownService:', error);
    throw error;
  }
};

export const getTahunAjaranAktifService = async () => {
  try {
    const tahunAjaran = await nilaiModel.getTahunAjaranAktif();

    if (!tahunAjaran) {
      throw new Error('Tidak ada tahun ajaran aktif');
    }

    return tahunAjaran;
  } catch (error) {
    console.error('Error in getTahunAjaranAktifService:', error);
    throw error;
  }
};

export const getSiswaWithNilaiService = async (guruId, kelasId, mapelId, tahunAjaranId, semester) => {
  try {
    if (!kelasId || !mapelId) {
      throw new Error('Parameter kelas_id dan mapel_id wajib diisi');
    }

    let finalTahunAjaranId = tahunAjaranId;
    let finalSemester = semester;

    if (!finalTahunAjaranId || !finalSemester) {
      const tahunAjaran = await nilaiModel.getTahunAjaranAktif();
      if (!tahunAjaran) {
        throw new Error('Tidak ada tahun ajaran aktif');
      }
      finalTahunAjaranId = tahunAjaran.tahun_ajaran_id;
      finalSemester = tahunAjaran.semester;
    }

    const mapelList = await nilaiModel.getMapelByGuruAndKelas(guruId, kelasId);
    const isAuthorized = mapelList.some(m => m.mapel_id == mapelId);

    if (!isAuthorized) {
      throw new Error('Anda tidak memiliki akses untuk kelas/mapel ini');
    }

    const kelasInfo = await nilaiModel.getKelasById(kelasId);
    if (!kelasInfo) {
      throw new Error('Kelas tidak ditemukan');
    }

    const mapelInfo = await nilaiModel.getMapelById(mapelId);
    if (!mapelInfo) {
      throw new Error('Mata pelajaran tidak ditemukan');
    }

    const tahunAjaranInfo = await nilaiModel.getTahunAjaranAktif();

    const siswaList = await nilaiModel.getSiswaWithNilai(
      kelasId,
      mapelId,
      finalTahunAjaranId,
      finalSemester
    );

    if (siswaList.length === 0) {
      throw new Error('Tidak ada siswa di kelas ini');
    }

    return {
      kelas: kelasInfo,
      mapel: mapelInfo,
      tahun_ajaran: {
        tahun_ajaran_id: tahunAjaranInfo.tahun_ajaran_id,
        nama_tahun_ajaran: tahunAjaranInfo.nama_tahun_ajaran,
        semester: tahunAjaranInfo.semester
      },
      siswa: siswaList
    };
  } catch (error) {
    console.error('Error in getSiswaWithNilaiService:', error);
    throw error;
  }
};


const VALID_NILAI_FIELDS = [
  'lm1_tp1', 'lm1_tp2', 'lm1_tp3', 'lm1_tp4',
  'lm2_tp1', 'lm2_tp2', 'lm2_tp3', 'lm2_tp4',
  'lm3_tp1', 'lm3_tp2', 'lm3_tp3', 'lm3_tp4',
  'lm4_tp1', 'lm4_tp2', 'lm4_tp3', 'lm4_tp4',
  'lm5_tp1', 'lm5_tp2', 'lm5_tp3', 'lm5_tp4',
  'lm1_ulangan', 'lm2_ulangan', 'lm3_ulangan', 'lm4_ulangan', 'lm5_ulangan',
  'uts', 'uas'
];


export const simpanCellService = async (guruId, userId, data) => {
  try {
    const { siswa_id, kelas_id, mapel_id, tahun_ajaran_id, semester, field, nilai } = data;

    if (!siswa_id || !kelas_id || !mapel_id || !tahun_ajaran_id || !semester || !field) {
      throw new Error('Semua field wajib diisi');
    }

    if (!VALID_NILAI_FIELDS.includes(field)) {
      throw new Error('Field tidak valid');
    }

    if (!['Ganjil', 'Genap'].includes(semester)) {
      throw new Error("Semester harus 'Ganjil' atau 'Genap'");
    }

    if (nilai !== null && nilai !== '') {
      const nilaiNum = Number(nilai);
      if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
        throw new Error('Nilai harus antara 0-100');
      }
    }

    const finalNilai = (nilai === '' || nilai === null) ? null : Number(nilai);

    const mapelList = await nilaiModel.getMapelByGuruAndKelas(guruId, kelas_id);
    const isAuthorized = mapelList.some(m => m.mapel_id == mapel_id);

    if (!isAuthorized) {
      throw new Error('Anda tidak memiliki akses untuk kelas/mapel ini');
    }

    const result = await nilaiModel.simpanCell({
      siswa_id,
      kelas_id,
      mapel_id,
      tahun_ajaran_id,
      semester,
      field,
      nilai: finalNilai,
      updated_by: userId
    });

    return {
      siswa_id,
      field,
      nilai: finalNilai,
      action: result.action,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in simpanCellService:', error);
    throw error;
  }
};

export default {
  getKelasDropdownService,
  getMapelDropdownService,
  getTahunAjaranAktifService,
  getSiswaWithNilaiService,
  simpanCellService
};

