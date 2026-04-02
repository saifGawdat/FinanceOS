import { Router } from "express";
import { GoalsController } from "../controllers/goals.controller";
import { auth } from "../middleware/auth.middleware";

const router = Router();
const goalsController = new GoalsController();

router.post("/", auth, goalsController.createGoal);
router.get("/", auth, goalsController.getGoals);
router.get("/:id", auth, goalsController.getGoalById);
router.put("/:id", auth, goalsController.updateGoal);
router.delete("/:id", auth, goalsController.deleteGoal);

export default router;
