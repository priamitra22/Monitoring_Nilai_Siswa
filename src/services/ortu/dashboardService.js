import * as dashboardModel from '../../models/ortu/dashboardModel.js';

export const getProfileAnakService = async (siswaId) => {
  try {
    const profileData = await dashboardModel.getProfileAnak(siswaId);
    const nilaiRataRata = await dashboardModel.getNilaiRataRata(siswaId);

    return {
      nama: profileData.nama,
      nisn: profileData.nisn,
      kelas: profileData.kelas,
      nilai_rata_rata: nilaiRataRata,
      semester: profileData.semester,
      tahun_ajaran: profileData.tahun_ajaran
    };
  } catch (error) {
    console.error('Error in getProfileAnakService:', error);
    throw error;
  }
};

export const getAbsensiHariIniService = async (siswaId) => {
  try {
    const absensiData = await dashboardModel.getAbsensiHariIni(siswaId);

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const tanggalFormatted = `${day}/${month}/${year}`;

    if (!absensiData) {
      const kelas = await dashboardModel.getKelasSiswa(siswaId);

      return {
        status_absensi: 'Belum Diabsen',
        tanggal: tanggalFormatted,
        kelas: kelas || '-'
      };
    }

    return {
      status_absensi: absensiData.status,
      tanggal: tanggalFormatted,
      kelas: absensiData.kelas
    };
  } catch (error) {
    console.error('Error in getAbsensiHariIniService:', error);
    throw error;
  }
};


export const getCatatanTerbaruService = async (siswaId, limit) => {
  try {
    const limitNum = parseInt(limit) || 5;

    if (limitNum < 1 || limitNum > 20) {
      throw new Error('Limit harus antara 1-20');
    }

    const catatanList = await dashboardModel.getCatatanTerbaru(siswaId, limitNum);

    const formattedCatatan = catatanList.map(catatan => {
      const tanggal = new Date(catatan.created_at);
      const day = String(tanggal.getDate()).padStart(2, '0');
      const month = String(tanggal.getMonth() + 1).padStart(2, '0');
      const year = tanggal.getFullYear();
      const tanggalFormatted = `${day}/${month}/${year}`;

      let catatanText = catatan.catatan || '';
      if (catatanText.length > 100) {
        catatanText = catatanText.substring(0, 97) + '...';
      }

      return {
        id: catatan.id,
        guru_nama: catatan.guru_nama,
        mata_pelajaran: catatan.mata_pelajaran || null,
        catatan: catatanText,
        tanggal: tanggalFormatted
      };
    });

    return formattedCatatan;
  } catch (error) {
    console.error('Error in getCatatanTerbaruService:', error);
    throw error;
  }
};

const getSingkatanMapel = (namaMapel) => {
  const singkatanMap = {
    'Matematika': 'MTK',
    'Bahasa Indonesia': 'B. Indo',
    'Ilmu Pengetahuan Alam': 'IPA',
    'Ilmu Pengetahuan Sosial': 'IPS',
    'Pendidikan Kewarganegaraan': 'PKN',
    'Pendidikan Jasmani Olahraga dan Kesehatan': 'PJOK',
    'Seni Budaya': 'Seni',
    'Prakarya': 'Prakarya',
    'Bahasa Inggris': 'B. Ing',
    'Bahasa Jawa': 'B. Jawa'
  };

  return singkatanMap[namaMapel] || namaMapel.substring(0, 10);
};

export const getNilaiPerMapelService = async (siswaId) => {
  try {
    const nilaiList = await dashboardModel.getNilaiPerMapel(siswaId);

    if (nilaiList.length === 0) {
      return {
        data: [],
        semester: null,
        tahun_ajaran: null
      };
    }

    const formattedNilai = nilaiList.map(nilai => {
      return {
        mapel: getSingkatanMapel(nilai.nama_mapel),
        nama_lengkap: nilai.nama_mapel,
        nilai: parseFloat(nilai.nilai_akhir) || 0
      };
    });

    return {
      data: formattedNilai,
      semester: nilaiList[0].semester,
      tahun_ajaran: nilaiList[0].tahun
    };
  } catch (error) {
    console.error('Error in getNilaiPerMapelService:', error);
    throw error;
  }
};

export default {
  getProfileAnakService,
  getAbsensiHariIniService,
  getCatatanTerbaruService,
  getNilaiPerMapelService
};

