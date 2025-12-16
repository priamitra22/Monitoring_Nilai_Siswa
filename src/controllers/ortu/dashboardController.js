import * as dashboardService from '../../services/ortu/dashboardService.js';

const getSiswaId = (req) => {
  return new Promise((resolve, reject) => {
    if (!req.user || !req.user.siswa_id) {
      return reject(new Error('Siswa ID tidak ditemukan. Pastikan Anda login sebagai orang tua.'));
    }
    resolve(req.user.siswa_id);
  });
};

export const getProfileAnak = async (req, res, next) => {
  try {
    const siswaId = await getSiswaId(req);
    const profileData = await dashboardService.getProfileAnakService(siswaId);

    res.status(200).json({
      status: 'success',
      data: profileData
    });
  } catch (error) {
    console.error('❌ Error in getProfileAnak controller:', error.message);

    if (error.message === 'Siswa ID tidak ditemukan. Pastikan Anda login sebagai orang tua.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Data siswa tidak ditemukan') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};

export const getAbsensiHariIni = async (req, res, next) => {
  try {
    const siswaId = await getSiswaId(req);

    const absensiData = await dashboardService.getAbsensiHariIniService(siswaId);

    res.status(200).json({
      status: 'success',
      data: absensiData
    });
  } catch (error) {
    console.error('❌ Error in getAbsensiHariIni controller:', error.message);

    if (error.message === 'Siswa ID tidak ditemukan. Pastikan Anda login sebagai orang tua.') {
      return res.status(401).json({
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
    const siswaId = await getSiswaId(req);
    const { limit } = req.query;

    const catatanData = await dashboardService.getCatatanTerbaruService(siswaId, limit);

    res.status(200).json({
      status: 'success',
      data: catatanData
    });
  } catch (error) {
    console.error('❌ Error in getCatatanTerbaru controller:', error.message);

    if (error.message === 'Siswa ID tidak ditemukan. Pastikan Anda login sebagai orang tua.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Limit harus antara 1-20') {
      return res.status(400).json({
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
    const siswaId = await getSiswaId(req);

    const nilaiData = await dashboardService.getNilaiPerMapelService(siswaId);

    res.status(200).json({
      status: 'success',
      data: nilaiData.data,
      semester: nilaiData.semester,
      tahun_ajaran: nilaiData.tahun_ajaran
    });
  } catch (error) {
    console.error('❌ Error in getNilaiPerMapel controller:', error.message);

    if (error.message === 'Siswa ID tidak ditemukan. Pastikan Anda login sebagai orang tua.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};

export default {
  getProfileAnak,
  getAbsensiHariIni,
  getCatatanTerbaru,
  getNilaiPerMapel
};

