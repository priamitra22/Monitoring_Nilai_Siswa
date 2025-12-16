import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import {
    getDataGuru,
    getDetailGuru,
    checkExistingGuru,
    checkMultipleGuru,
    bulkCreateGuru,
    checkExistingGuruWithExclude,
    updateGuru,
    deleteGuru
} from "../../controllers/admin/guruController.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getDataGuru);

router.get("/:id", getDetailGuru);

router.post("/check", checkExistingGuru);

router.post("/check-multiple", checkMultipleGuru);

router.post("/bulk", bulkCreateGuru);

router.post("/check-with-exclude", checkExistingGuruWithExclude);

router.put("/:id", updateGuru);

router.delete("/:id", deleteGuru);

export default router;