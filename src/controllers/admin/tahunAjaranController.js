import { 
  getAllTahunAjaranService, 
  getTahunAjaranAktifService, 
  getTahunAjaranByIdService,
  createTahunAjaranService,
  deleteTahunAjaranService,
  toggleTahunAjaranStatusService
} from "../../services/admin/tahunAjaranService.js";

export const getAllTahunAjaran = async (req, res, next) => {
  try {
    const { sort, order } = req.query;
    const result = await getAllTahunAjaranService(sort, order);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
      data: null
    });
  }
};

export const getTahunAjaranAktif = async (req, res, next) => {
  try {
    const result = await getTahunAjaranAktifService();
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
      data: null
    });
  }
};

export const getTahunAjaranById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getTahunAjaranByIdService(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
      data: null
    });
  }
};

export const createTahunAjaran = async (req, res, next) => {
  try {
    const result = await createTahunAjaranService(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
      data: null
    });
  }
};

export const toggleTahunAjaranStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await toggleTahunAjaranStatusService(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
      data: null
    });
  }
};

export const deleteTahunAjaran = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteTahunAjaranService(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
      data: null
    });
  }
};
