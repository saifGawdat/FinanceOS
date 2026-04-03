import { Router } from "express";
import { RecurringController } from "../controllers/recurring.controller";
import { auth } from "../middleware/auth.middleware";

const router = Router();
const recurringController = new RecurringController();

router.get("/", auth, recurringController.getAll);
router.post("/", auth, recurringController.create);
router.patch("/:id", auth, recurringController.update);
router.patch("/:id/toggle", auth, recurringController.toggleActive);
router.delete("/:id", auth, recurringController.delete);

export default router;
