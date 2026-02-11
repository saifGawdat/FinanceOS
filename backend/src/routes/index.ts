import { Router } from "express";
import authRoutes from "./auth.routes";
import incomeRoutes from "./income.routes";
import expenseRoutes from "./expense.routes";
import customerRoutes from "./customer.routes";
import employeeRoutes from "./employee.routes";
import expenseCategoryRoutes from "./expense-category.routes";
import monthlySummaryRoutes from "./monthly-summary.routes";
import dashboardRoutes from "./dashboard.routes";
import aiRoutes from "./ai.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/income", incomeRoutes);
router.use("/expense", expenseRoutes);
router.use("/customer", customerRoutes);
router.use("/employee", employeeRoutes);
router.use("/expense-category", expenseCategoryRoutes);
router.use("/monthly-summary", monthlySummaryRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/ai", aiRoutes);

export default router;
