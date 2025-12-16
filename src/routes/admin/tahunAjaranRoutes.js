import express from "express";
import {
  getAllTahunAjaran,
  getTahunAjaranAktif,
  getTahunAjaranById,
  createTahunAjaran,
  deleteTahunAjaran,
  toggleTahunAjaranStatus
} from "../../controllers/admin/tahunAjaranController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAllTahunAjaran);

router.get("/aktif", getTahunAjaranAktif);

router.post("/", createTahunAjaran);

router.patch("/:id/toggle-status", toggleTahunAjaranStatus);

router.delete("/:id", deleteTahunAjaran);

router.get("/:id", getTahunAjaranById);

export default router;
