import { Router } from "express";
import {
  getDataSiswa,
  getDetailSiswa,
  checkExistingSiswa,
  checkExistingSiswaWithExclude,
  checkMultipleSiswa,
  bulkCreateSiswa,
  updateSiswa,
  deleteSiswa,
} from "../../controllers/admin/siswaController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getDataSiswa);

router.get("/:id", getDetailSiswa);

router.post("/check", checkExistingSiswa);

router.post("/check-with-exclude", checkExistingSiswaWithExclude);

router.post("/check-multiple", checkMultipleSiswa);

router.post("/bulk", bulkCreateSiswa);

router.put("/:id", updateSiswa);

router.delete("/:id", deleteSiswa);

export default router;