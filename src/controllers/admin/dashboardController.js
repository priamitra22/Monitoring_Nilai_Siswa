import dashboardService from '../../services/admin/dashboardService.js';

export const getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummaryService();

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getSiswaGender = async (req, res, next) => {
  try {
    const data = await dashboardService.getSiswaGenderService();

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getSiswaPerKelas = async (req, res, next) => {
  try {
    const data = await dashboardService.getSiswaPerKelasService();

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getSummary,
  getSiswaGender,
  getSiswaPerKelas
};

