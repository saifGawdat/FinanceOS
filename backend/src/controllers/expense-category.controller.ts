import { Request, Response, NextFunction } from "express";
import { ExpenseCategoryService } from "../services/expense-category.service";

export class ExpenseCategoryController {
  private expenseCategoryService = new ExpenseCategoryService();

  getExpenseCategories = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { month, year } = req.query;
      const categories = await this.expenseCategoryService.getAll(
        req.userId!,
        month ? parseInt(month as string) : undefined,
        year ? parseInt(year as string) : undefined,
      );
      res.json(categories);
    } catch (error) {
      next(error);
    }
  };

  getMonthlyExpenseBreakdown = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { month, year } = req.params;
      const breakdown = await this.expenseCategoryService.getBreakdown(
        req.userId!,
        parseInt(month as string),
        parseInt(year as string),
      );
      res.json(breakdown);
    } catch (error) {
      next(error);
    }
  };

  createExpenseCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const category = await this.expenseCategoryService.create(
        req.userId!,
        req.body,
      );
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  };

  updateExpenseCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const category = await this.expenseCategoryService.update(
        req.userId!,
        req.params.id as string,
        req.body,
      );
      res.json(category);
    } catch (error) {
      next(error);
    }
  };

  deleteExpenseCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.expenseCategoryService.delete(
        req.userId!,
        req.params.id as string,
      );
      res.json({ message: "Expense category deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  getUniqueCategories = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const categories = await this.expenseCategoryService.getUniqueCategories(
        req.userId!,
      );
      res.json(categories);
    } catch (error) {
      next(error);
    }
  };

  copyPreviousMonthCategories = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { month, year } = req.body;
      const categories =
        await this.expenseCategoryService.copyFromPreviousMonth(
          req.userId!,
          parseInt(month),
          parseInt(year),
        );
      res.status(201).json(categories);
    } catch (error) {
      next(error);
    }
  };
}
