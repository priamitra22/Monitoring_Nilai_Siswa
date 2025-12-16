import dashboardService from '../../services/guru/dashboardService.js';

const getGuruId = async (req) => {
  if (!req.user || !req.user.guru_id) {
    throw new Error('Guru ID tidak ditemukan. Pastikan Anda login sebagai guru.');
  }
  return req.user.guru_id;
};

export const getStatistikSiswa = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);


    const statistik = await dashboardService.getStatistikSiswaService(guruId);
    res.status(200).json({
      status: 'success',
      data: statistik
    });
  } catch (error) {
    console.error('❌ Error in getStatistikSiswa controller:', error.message);

    if (error.message === 'Guru ID tidak ditemukan. Pastikan Anda login sebagai guru.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};

export const getPeringkatSiswa = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);
    const { page, per_page } = req.query;

    const peringkat = await dashboardService.getPeringkatSiswaService(guruId, page, per_page);

    res.status(200).json({
      status: 'success',
      data: peringkat
    });
  } catch (error) {
    console.error('❌ Error in getPeringkatSiswa controller:', error.message);

    if (error.message === 'Guru ID tidak ditemukan. Pastikan Anda login sebagai guru.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Page harus lebih besar dari 0' ||
      error.message === 'Per page harus antara 1-100') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Fitur Peringkat Siswa hanya tersedia untuk Wali Kelas') {
      return res.status(403).json({
        status: 'error',
        message: error.message,
        code: 403
      });
    }

    next(error);
  }
};


export const getMataPelajaran = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);

    const mapelList = await dashboardService.getMataPelajaranService(guruId);

    res.status(200).json({
      status: 'success',
      data: mapelList
    });
  } catch (error) {
    console.error('❌ Error in getMataPelajaran controller:', error.message);

    if (error.message === 'Guru ID tidak ditemukan. Pastikan Anda login sebagai guru.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Anda tidak mengampu mata pelajaran apapun') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};

export const getNilaiPerMapel = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);
    const { mapel_id, page, per_page } = req.query;

    const nilaiData = await dashboardService.getNilaiPerMapelService(guruId, mapel_id, page, per_page);

    res.status(200).json({
      status: 'success',
      data: nilaiData
    });
  } catch (error) {
    console.error('❌ Error in getNilaiPerMapel controller:', error.message);

    if (error.message === 'Guru ID tidak ditemukan. Pastikan Anda login sebagai guru.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Parameter mapel_id wajib diisi' ||
      error.message === 'Parameter mapel_id harus berupa angka positif' ||
      error.message === 'Page harus lebih besar dari 0' ||
      error.message === 'Per page harus antara 1-100') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Anda tidak mengampu mata pelajaran ini' ||
      error.message === 'Mata pelajaran tidak ada di kelas Anda') {
      return res.status(403).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Mata pelajaran tidak ditemukan') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};


export const getKehadiranKelas = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);


    const kelasData = await dashboardService.getKehadiranKelasService(guruId);

    res.status(200).json({
      status: 'success',
      data: kelasData
    });
  } catch (error) {
    console.error('❌ Error in getKehadiranKelas controller:', error.message);

    if (error.message === 'Guru ID tidak ditemukan. Pastikan Anda login sebagai guru.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};


export const getKehadiranHariIni = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);
    const { kelas_id } = req.query;

    const kehadiranData = await dashboardService.getKehadiranHariIniService(guruId, kelas_id);

    res.status(200).json({
      status: 'success',
      data: kehadiranData
    });
  } catch (error) {
    console.error('❌ Error in getKehadiranHariIni controller:', error.message);

    if (error.message === 'Guru ID tidak ditemukan. Pastikan Anda login sebagai guru.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Parameter kelas_id wajib diisi untuk Guru Mapel' ||
      error.message === 'Parameter kelas_id harus berupa angka positif') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Anda tidak mengajar di kelas ini') {
      return res.status(403).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};


export const getCatatanTerbaru = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);
    const { limit } = req.query;

    const catatanData = await dashboardService.getCatatanTerbaruService(guruId, limit);
    res.status(200).json({
      status: 'success',
      data: catatanData
    });
  } catch (error) {
    console.error('❌ Error in getCatatanTerbaru controller:', error.message);

    if (error.message === 'Guru ID tidak ditemukan. Pastikan Anda login sebagai guru.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Limit harus antara 1-50') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};

export default {
  getStatistikSiswa,
  getPeringkatSiswa,
  getMataPelajaran,
  getNilaiPerMapel,
  getKehadiranKelas,
  getKehadiranHariIni,
  getCatatanTerbaru
};

