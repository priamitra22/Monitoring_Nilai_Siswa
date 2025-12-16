import {
  fetchDataUsers,
  fetchAvailableGuru,
  fetchAvailableOrtu,
  fetchChildrenByParent,
  validateFieldService,
  createUserService,
  createBulkUsersService,
  resetPasswordService,
  deleteUserService
} from "../../services/admin/userService.js";

export const getDataUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "",
      status = "",
      sort_by = "nama_lengkap",
      sort_order = "ASC"
    } = req.query;

    const result = await fetchDataUsers(
      page,
      limit,
      search,
      role,
      status,
      sort_by,
      sort_order
    );

    if (result.status === "success") {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in getDataUsers controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getAvailableGuru = async (req, res) => {
  try {
    const {
      search = "",
      limit = 50
    } = req.query;

    const result = await fetchAvailableGuru(search, limit);

    if (result.status === "success") {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in getAvailableGuru controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getAvailableOrtu = async (req, res) => {
  try {
    const {
      search = "",
      limit = 50
    } = req.query;

    const result = await fetchAvailableOrtu(search, limit);

    if (result.status === "success") {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in getAvailableOrtu controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const getChildrenByParent = async (req, res) => {
  try {
    const { ortu_id } = req.params;
    const {
      search = "",
      limit = 50
    } = req.query;

    const result = await fetchChildrenByParent(ortu_id, search, limit);

    if (result.status === "success") {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in getChildrenByParent controller:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
      data: null
    });
  }
};

export const validateField = async (req, res) => {
  try {
    const result = await validateFieldService(req.body || {});
    if (result.status === "success") {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in validateField controller:", error);
    res.status(500).json({ status: "error", message: "Terjadi kesalahan server", data: null });
  }
};

export const createUser = async (req, res) => {
  try {
    const result = await createUserService(req.body || {});
    if (result.status === "success") {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in createUser controller:", error);
    res.status(500).json({ status: "error", message: "Terjadi kesalahan server", data: null });
  }
};

export const createBulkUsers = async (req, res) => {
  try {
    const result = await createBulkUsersService(req.body?.users || []);
    if (result.status === "success") {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in createBulkUsers controller:", error);
    res.status(500).json({ status: "error", message: "Terjadi kesalahan server", data: null });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await resetPasswordService(id);

    if (result.status === "success") {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in resetPassword controller:", error);
    res.status(500).json({ status: "error", message: "Terjadi kesalahan server", data: null });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    const result = await deleteUserService(id, currentUserId);

    if (result.status === "success") {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in deleteUser controller:", error);
    res.status(500).json({ status: "error", message: "Terjadi kesalahan server", data: null });
  }
};
