import absensiService from '../../services/guru/absensiService.js';

const getGuruId = async (req) => {
  let guruId = req.user.guru_id;

  if (!guruId) {
    const db = (await import('../../config/db.js')).default;
    const [results] = await new Promise((resolve, reject) => {
      db.query('SELECT id FROM guru WHERE user_id = ?', [req.user.id], (err, results) => {
        if (err) return reject(err);
        resolve([results]);
      });
    });

    if (!results || results.length === 0) {
      throw new Error('Guru ID tidak ditemukan. Pastikan Anda login sebagai guru');
    }

    guruId = results[0].id;
  }

  return guruId;
};


export const getSiswaAbsensi = async (req, res, next) => {
  try {
    const { tanggal, kelas_id } = req.query;
    const guruId = await getGuruId(req);

    const data = await absensiService.getSiswaAbsensiService(
      tanggal,
      kelas_id,
      guruId
    );

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    if (error.message.includes('bukan wali kelas') ||
      error.message.includes('tidak ada kelas') ||
      error.message.includes('tidak mengajar') ||
      error.message.includes('tidak mengampu')) {
      return res.status(403).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message.includes('tidak valid') ||
      error.message.includes('harus') ||
      error.message.includes('wajib')) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};


export const getKelasSaya = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);
    const data = await absensiService.getKelasSayaService(guruId);

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    if (error.message.includes('tidak mengampu')) {
      return res.status(403).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};


export const saveAbsensi = async (req, res, next) => {
  try {
    const { tanggal, absensi } = req.body;
    const guruId = await getGuruId(req);

    const data = await absensiService.saveAbsensiService(
      tanggal,
      absensi,
      guruId
    );

    res.status(200).json({
      status: 'success',
      message: 'Absensi berhasil disimpan',
      data
    });
  } catch (error) {
    if (error.message.includes('Hanya wali kelas')) {
      return res.status(403).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message.includes('tidak valid') ||
      error.message.includes('harus') ||
      error.message.includes('tidak boleh') ||
      error.message.includes('Masih ada') ||
      error.message.includes('tidak ditemukan')) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};


export const getRekapAbsensi = async (req, res, next) => {
  try {
    const { tanggal_mulai, tanggal_akhir, kelas_id } = req.query;
    const guruId = await getGuruId(req);

    const data = await absensiService.getRekapAbsensiService(
      tanggal_mulai,
      tanggal_akhir,
      kelas_id,
      guruId
    );

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    if (error.message.includes('tidak mengajar') ||
      error.message.includes('tidak mengampu') ||
      error.message.includes('wajib untuk guru mapel')) {
      return res.status(403).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message.includes('tidak valid') ||
      error.message.includes('harus') ||
      error.message.includes('tidak boleh')) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};


export const getDateRange = async (req, res, next) => {
  try {
    const data = await absensiService.getDateRangeService();

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    if (error.message.includes('Tidak ada tahun ajaran aktif')) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};

export default {
  getSiswaAbsensi,
  getKelasSaya,
  saveAbsensi,
  getRekapAbsensi,
  getDateRange
};
