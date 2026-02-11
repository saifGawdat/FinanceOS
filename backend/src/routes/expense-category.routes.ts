import { Router } from "express";
import { ExpenseCategoryController } from "../controllers/expense-category.controller";
import { auth } from "../middleware/auth.middleware";

const router = Router();
const expenseCategoryController = new ExpenseCategoryController();

router.get("/", auth, expenseCategoryController.getExpenseCategories);
router.get(
  "/monthly/:month/:year",
  auth,
  expenseCategoryController.getMonthlyExpenseBreakdown,
);
router.get("/unique", auth, expenseCategoryController.getUniqueCategories);
router.post("/", auth, expenseCategoryController.createExpenseCategory);
router.post(
  "/copy-previous",
  auth,
  expenseCategoryController.copyPreviousMonthCategories,
);
router.put("/:id", auth, expenseCategoryController.updateExpenseCategory);
router.delete("/:id", auth, expenseCategoryController.deleteExpenseCategory);

export default router;
