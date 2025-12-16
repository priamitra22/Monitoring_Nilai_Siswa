import catatanService from '../../services/guru/catatanService.js';

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

export const getCatatanList = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);

    const filters = {
      page: req.query.page,
      per_page: req.query.per_page,
      search: req.query.search,
      kategori: req.query.kategori,
      jenis: req.query.jenis,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order
    };

    const data = await catatanService.getCatatanListService(guruId, filters);

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    if (error.message.includes('tidak valid') ||
      error.message.includes('harus')) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }

    next(error);
  }
};

export const getKelasDropdown = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);

    const data = await catatanService.getKelasDropdownService(guruId);

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    if (error.message === 'Anda tidak mengampu kelas apapun') {
      return res.status(403).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }
    next(error);
  }
};

export const getSiswaDropdown = async (req, res, next) => {
  try {
    const { kelas_id } = req.query;

    const data = await catatanService.getSiswaDropdownService(kelas_id);

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    if (error.message.includes('wajib') ||
      error.message.includes('tidak valid') ||
      error.message.includes('Tidak ada siswa')) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }
    next(error);
  }
};
export const getMapelDropdown = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);
    const { kelas_id } = req.query;

    const data = await catatanService.getMapelDropdownService(guruId, kelas_id);

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    if (error.message.includes('wajib') ||
      error.message.includes('tidak valid') ||
      error.message.includes('Tidak ada') ||
      error.message.includes('tidak mengampu')) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }
    next(error);
  }
};


export const createCatatan = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);
    const userId = req.user.id;

    const data = await catatanService.createCatatanService(guruId, userId, req.body);

    res.status(201).json({
      status: 'success',
      message: 'Catatan berhasil ditambahkan',
      data
    });
  } catch (error) {
    if (error.message.includes('harus') ||
      error.message.includes('tidak valid') ||
      error.message.includes('minimal') ||
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


export const getCatatanStatistik = async (req, res, next) => {
  try {
    const guruId = await getGuruId(req);

    const data = await catatanService.getCatatanStatistikService(guruId);

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};


export const getCatatanDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const data = await catatanService.getCatatanDetailService(id, userId, userRole);

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }
    next(error);
  }
};


export const addCatatanReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const data = await catatanService.addCatatanReplyService(id, userId, req.body);

    res.status(201).json({
      status: 'success',
      message: data.message,
      data: data.catatan
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }
    if (error.message.includes('harus') ||
      error.message.includes('tidak boleh kosong')) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }
    next(error);
  }
};


export const getCatatanForEdit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const guruId = await getGuruId(req);

    const data = await catatanService.getCatatanForEditService(id, guruId);

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan') ||
      error.message.includes('tidak memiliki akses')) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }
    next(error);
  }
};


export const updateCatatan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const guruId = await getGuruId(req);

    const data = await catatanService.updateCatatanService(id, guruId, req.body);

    res.status(200).json({
      status: 'success',
      message: 'Catatan berhasil diperbarui',
      data
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan') ||
      error.message.includes('tidak memiliki akses')) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }
    if (error.message.includes('Waktu edit sudah habis')) {
      return res.status(403).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }
    if (error.message.includes('harus') ||
      error.message.includes('tidak valid') ||
      error.message.includes('minimal')) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }
    next(error);
  }
};


export const deleteCatatan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const guruId = await getGuruId(req);

    const data = await catatanService.deleteCatatanService(id, guruId);

    res.status(200).json({
      status: 'success',
      message: data.message,
      data: { catatan_id: data.catatan_id }
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan') ||
      error.message.includes('tidak memiliki akses')) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }
    if (error.message.includes('Waktu hapus sudah habis')) {
      return res.status(403).json({
        status: 'error',
        message: error.message,
        data: null
      });
    }
    next(error);
  }
};

export default {
  getCatatanList,
  getCatatanStatistik,
  getKelasDropdown,
  getSiswaDropdown,
  getMapelDropdown,
  createCatatan,
  getCatatanDetail,
  addCatatanReply,
  getCatatanForEdit,
  updateCatatan,
  deleteCatatan
};

