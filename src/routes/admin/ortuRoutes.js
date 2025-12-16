import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import {
    getDataOrtu,
    getDetailOrtu,
    getDetailOrtuWithAnak,
    getAvailableStudents,
    getAvailableStudentsForEdit,
    checkExistingOrtuNik,
    checkExistingOrtuNikWithExclude,
    checkMultipleOrtuNik,
    bulkCreateOrtu,
    updateOrtu,
    deleteOrtu
} from "../../controllers/admin/ortuController.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getDataOrtu);

router.get("/available-students", getAvailableStudents);

router.get("/available-students-edit", getAvailableStudentsForEdit);

router.get("/:id", getDetailOrtuWithAnak);

router.post("/check", checkExistingOrtuNik);

router.post("/check-with-exclude", checkExistingOrtuNikWithExclude);

router.post("/check-multiple", checkMultipleOrtuNik);

router.post("/bulk", bulkCreateOrtu);

router.put("/:id", updateOrtu);

router.delete("/:id", deleteOrtu);

export default router;
