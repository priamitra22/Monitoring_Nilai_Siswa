import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import {
    getDataUsers,
    getAvailableGuru,
    getAvailableOrtu,
    getChildrenByParent,
    validateField,
    createUser,
    createBulkUsers,
    resetPassword,
    deleteUser
} from "../../controllers/admin/userController.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getDataUsers);

router.get("/available-guru", getAvailableGuru);

router.get("/available-ortu", getAvailableOrtu);
router.get("/children-by-parent/:ortu_id", getChildrenByParent);

router.post("/validate-field", validateField);

router.post("/", createUser);

router.post("/bulk", createBulkUsers);

router.post("/:id/reset-password", resetPassword);

router.delete("/:id", deleteUser);

export default router;
