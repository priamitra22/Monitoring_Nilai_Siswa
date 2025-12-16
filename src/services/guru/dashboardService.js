import * as dashboardModel from '../../models/guru/dashboardModel.js';

export const getStatistikSiswaService = async (guruId) => {
  try {
    const waliKelasInfo = await dashboardModel.checkIsWaliKelas(guruId);

    if (waliKelasInfo) {
      const statistik = await dashboardModel.getStatistikSiswaWaliKelas(waliKelasInfo.kelas_id);
      return statistik;
    } else {
      const statistik = await dashboardModel.getStatistikSiswaGuruMapel(guruId);
      return statistik;
    }
  } catch (error) {
    console.error('Error in getStatistikSiswaService:', error);
    throw error;
  }
};

export const getPeringkatSiswaService = async (guruId, page, perPage) => {
  try {
    const waliKelasInfo = await dashboardModel.checkIsWaliKelas(guruId);

    if (!waliKelasInfo) {
      throw new Error('Fitur Peringkat Siswa hanya tersedia untuk Wali Kelas');
    }

    const pageNum = parseInt(page) || 1;
    const perPageNum = parseInt(perPage) || 10;

    if (pageNum < 1) {
      throw new Error('Page harus lebih besar dari 0');
    }

    if (perPageNum < 1 || perPageNum > 100) {
      throw new Error('Per page harus antara 1-100');
    }

    const peringkat = await dashboardModel.getPeringkatSiswa(waliKelasInfo.kelas_id, pageNum, perPageNum);
    return peringkat;
  } catch (error) {
    console.error('Error in getPeringkatSiswaService:', error);
    throw error;
  }
};


export const getMataPelajaranService = async (guruId) => {
  try {
    const waliKelasInfo = await dashboardModel.checkIsWaliKelas(guruId);

    let mapelList;

    if (waliKelasInfo) {
      mapelList = await dashboardModel.getMataPelajaranWaliKelas(waliKelasInfo.kelas_id);
    } else {
      const mapelListRaw = await dashboardModel.getMataPelajaranGuruMapel(guruId);
      mapelList = mapelListRaw.map(item => ({
        mapel_id: item.mapel_id,
        kelas_id: item.kelas_id,
        nama_mapel: `${item.nama_mapel} (${item.nama_kelas})`
      }));
    }

    if (mapelList.length === 0) {
      throw new Error('Anda tidak mengampu mata pelajaran apapun');
    }

    return mapelList;
  } catch (error) {
    console.error('Error in getMataPelajaranService:', error);
    throw error;
  }
};

export const getNilaiPerMapelService = async (guruId, mapelId, page, perPage) => {
  try {
    if (!mapelId) {
      throw new Error('Parameter mapel_id wajib diisi');
    }

    const mapelIdNum = parseInt(mapelId);
    if (isNaN(mapelIdNum) || mapelIdNum < 1) {
      throw new Error('Parameter mapel_id harus berupa angka positif');
    }

    const pageNum = parseInt(page) || 1;
    const perPageNum = parseInt(perPage) || 10;

    if (pageNum < 1) {
      throw new Error('Page harus lebih besar dari 0');
    }

    if (perPageNum < 1 || perPageNum > 100) {
      throw new Error('Per page harus antara 1-100');
    }

    const mapelInfo = await dashboardModel.getMapelById(mapelIdNum);
    if (!mapelInfo) {
      throw new Error('Mata pelajaran tidak ditemukan');
    }

    const waliKelasInfo = await dashboardModel.checkIsWaliKelas(guruId);

    let nilaiData;

    if (waliKelasInfo) {
      const hasMapel = await dashboardModel.checkWaliKelasHasMapel(waliKelasInfo.kelas_id, mapelIdNum);
      if (!hasMapel) {
        throw new Error('Mata pelajaran tidak ada di kelas Anda');
      }

      nilaiData = await dashboardModel.getNilaiPerMapelWaliKelas(waliKelasInfo.kelas_id, mapelIdNum, pageNum, perPageNum);
    } else {
      const mengampu = await dashboardModel.checkGuruMengampuMapel(guruId, mapelIdNum);
      if (!mengampu) {
        throw new Error('Anda tidak mengampu mata pelajaran ini');
      }

      nilaiData = await dashboardModel.getNilaiPerMapelGuruMapel(guruId, mapelIdNum, pageNum, perPageNum);
    }

    return {
      siswa: nilaiData.siswa,
      mata_pelajaran: {
        id: mapelInfo.id,
        nama: mapelInfo.nama_mapel
      },
      pagination: nilaiData.pagination
    };
  } catch (error) {
    console.error('Error in getNilaiPerMapelService:', error);
    throw error;
  }
};

export const getKehadiranKelasService = async (guruId) => {
  try {
    const waliKelasInfo = await dashboardModel.checkIsWaliKelas(guruId);

    if (waliKelasInfo) {
      return {
        is_wali_kelas: true,
        kelas_id: waliKelasInfo.kelas_id,
        nama_kelas: waliKelasInfo.nama_kelas
      };
    } else {
      const kelasList = await dashboardModel.getKelasListGuruMapel(guruId);
      return {
        is_wali_kelas: false,
        kelas_list: kelasList
      };
    }
  } catch (error) {
    console.error('Error in getKehadiranKelasService:', error);
    throw error;
  }
};

export const getKehadiranHariIniService = async (guruId, kelasId) => {
  try {
    const waliKelasInfo = await dashboardModel.checkIsWaliKelas(guruId);

    let kehadiranData;

    if (waliKelasInfo) {
      kehadiranData = await dashboardModel.getKehadiranHariIniWaliKelas(waliKelasInfo.kelas_id);
    } else {
      if (!kelasId) {
        throw new Error('Parameter kelas_id wajib diisi untuk Guru Mapel');
      }

      const kelasIdNum = parseInt(kelasId);
      if (isNaN(kelasIdNum) || kelasIdNum < 1) {
        throw new Error('Parameter kelas_id harus berupa angka positif');
      }

      const mengajar = await dashboardModel.checkGuruMengajarDiKelas(guruId, kelasIdNum);
      if (!mengajar) {
        throw new Error('Anda tidak mengajar di kelas ini');
      }

      kehadiranData = await dashboardModel.getKehadiranHariIniGuruMapel(kelasIdNum);
    }

    const tanggal = new Date(kehadiranData.tanggal);
    const day = String(tanggal.getDate()).padStart(2, '0');
    const month = String(tanggal.getMonth() + 1).padStart(2, '0');
    const year = tanggal.getFullYear();
    const tanggalFormatted = `${day}/${month}/${year}`;

    return {
      tanggal: tanggalFormatted,
      kelas: kehadiranData.kelas,
      kehadiran: [
        {
          name: 'Hadir',
          value: parseInt(kehadiranData.hadir) || 0
        },
        {
          name: 'Sakit',
          value: parseInt(kehadiranData.sakit) || 0
        },
        {
          name: 'Izin',
          value: parseInt(kehadiranData.izin) || 0
        },
        {
          name: 'Alpha',
          value: parseInt(kehadiranData.alpha) || 0
        }
      ],
      total_siswa: parseInt(kehadiranData.total_siswa) || 0
    };
  } catch (error) {
    console.error('Error in getKehadiranHariIniService:', error);
    throw error;
  }
};


export const getCatatanTerbaruService = async (guruId, limit) => {
  try {
    const limitNum = parseInt(limit) || 6;

    if (limitNum < 1 || limitNum > 50) {
      throw new Error('Limit harus antara 1-50');
    }

    const waliKelasInfo = await dashboardModel.checkIsWaliKelas(guruId);

    let catatanList;

    if (waliKelasInfo) {
      catatanList = await dashboardModel.getCatatanTerbaruWaliKelas(waliKelasInfo.kelas_id, limitNum);
    } else {
      catatanList = await dashboardModel.getCatatanTerbaruGuruMapel(guruId, limitNum);
    }

    const formattedCatatan = catatanList.map(catatan => {
      const tanggal = new Date(catatan.created_at);
      const day = String(tanggal.getDate()).padStart(2, '0');
      const month = String(tanggal.getMonth() + 1).padStart(2, '0');
      const year = tanggal.getFullYear();
      const tanggalFormatted = `${day}/${month}/${year}`;
      let catatanText = catatan.catatan || '';
      if (catatanText.length > 60) {
        catatanText = catatanText.substring(0, 60) + '...';
      }

      const result = {
        id: catatan.id,
        nama_siswa: catatan.nama_siswa,
        kelas: catatan.kelas,
        catatan: catatanText,
        tanggal: tanggalFormatted
      };

      if (waliKelasInfo && catatan.nama_guru) {
        result.nama_guru = catatan.nama_guru;
      }

      return result;
    });

    return formattedCatatan;
  } catch (error) {
    console.error('Error in getCatatanTerbaruService:', error);
    throw error;
  }
};

export default {
  getStatistikSiswaService,
  getPeringkatSiswaService,
  getMataPelajaranService,
  getNilaiPerMapelService,
  getKehadiranKelasService,
  getKehadiranHariIniService,
  getCatatanTerbaruService
};

