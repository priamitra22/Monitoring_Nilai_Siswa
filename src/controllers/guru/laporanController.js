import laporanService from '../../services/guru/laporanService.js';

const getGuruId = async (req) => {
  if (!req.user || !req.user.guru_id) {
    throw new Error('Guru ID tidak ditemukan. Pastikan Anda login sebagai guru.');
  }
  return req.user.guru_id;
};

export const getKelasWali = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);

    const kelasInfo = await laporanService.getKelasWaliService(guruId);

    res.status(200).json({
      status: 'success',
      data: kelasInfo
    });
  } catch (error) {
    console.error('❌ Error in getKelasWali:', error.message);


    if (error.message === 'Guru ID tidak ditemukan. Pastikan Anda login sebagai guru.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Anda tidak memiliki akses sebagai wali kelas') {
      return res.status(403).json({
        status: 'error',
        message: error.message,
        code: 403
      });
    }

    if (error.message === 'Anda belum ditugaskan sebagai wali kelas') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};

export const getSiswaList = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);
    const { kelas_id } = req.query;
    const siswaList = await laporanService.getSiswaListService(
      guruId,
      kelas_id ? parseInt(kelas_id) : null
    );

    res.status(200).json({
      status: 'success',
      data: siswaList
    });
  } catch (error) {
    console.error('❌ Error in getSiswaList:', error.message);


    if (error.message === 'Guru ID tidak ditemukan. Pastikan Anda login sebagai guru.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Parameter kelas_id wajib diisi') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Anda bukan wali kelas dari kelas ini') {
      return res.status(403).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Tidak ada siswa di kelas ini') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};

export const getPerkembanganSiswa = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);
    const { siswa_id } = req.query;
    const perkembangan = await laporanService.getPerkembanganSiswaService(
      guruId,
      siswa_id ? parseInt(siswa_id) : null
    );

    res.status(200).json({
      status: 'success',
      data: perkembangan
    });
  } catch (error) {
    console.error('❌ Error in getPerkembanganSiswa:', error.message);


    if (error.message === 'Guru ID tidak ditemukan. Pastikan Anda login sebagai guru.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Parameter siswa_id wajib diisi') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Anda bukan wali kelas dari siswa ini') {
      return res.status(403).json({
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

export const downloadPDFPerkembangan = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);
    const { siswa_id, catatan_wali_kelas } = req.body;
    if (!siswa_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter siswa_id wajib diisi',
        data: null
      });
    }

    if (!catatan_wali_kelas || catatan_wali_kelas.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Catatan wali kelas wajib diisi',
        data: null
      });
    }

    const pdfBuffer = await laporanService.generatePDFPerkembanganService(
      guruId,
      parseInt(siswa_id),
      catatan_wali_kelas
    );

    const perkembanganData = await laporanService.getPerkembanganSiswaService(guruId, parseInt(siswa_id));
    const siswaName = (perkembanganData.siswa?.nama || 'Siswa').replace(/\s+/g, '_');
    const kelasName = (perkembanganData.siswa?.kelas || 'Kelas').replace(/\s+/g, '_');
    const timestamp = new Date().getTime();

    const filename = `Laporan_Perkembangan_${siswaName}_${kelasName}_${timestamp}.pdf`;
    const encodedFilename = encodeURIComponent(filename);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Error in downloadPDFPerkembangan:', error.message);

    if (error.message === 'Guru ID tidak ditemukan. Pastikan Anda login sebagai guru.') {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Anda bukan wali kelas dari siswa ini') {
      return res.status(403).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    if (error.message === 'Parameter siswa_id wajib diisi' ||
      error.message === 'Siswa ID wajib diisi' ||
      error.message === 'Catatan wali kelas wajib diisi') {
      return res.status(400).json({
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

export default {
  getKelasWali,
  getSiswaList,
  getPerkembanganSiswa,
  downloadPDFPerkembangan
};

