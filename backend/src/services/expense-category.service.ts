import { ExpenseCategory, IExpenseCategory } from "../models/ExpenseCategory";
import { Expense } from "../models/Expense";
import {
  CreateExpenseCategoryDTO,
  UpdateExpenseCategoryDTO,
} from "../dtos/expense-category.dto";
import { NotFoundError, ValidationError } from "../errors";
import { MonthlySummaryService } from "./monthly-summary.service";

export class ExpenseCategoryService {
  private monthlySummaryService = new MonthlySummaryService();

  async create(
    userId: string,
    data: CreateExpenseCategoryDTO,
  ): Promise<IExpenseCategory> {
    if (data.amount < 0) {
      throw new ValidationError("Amount cannot be negative");
    }

    const expenseCategory = new ExpenseCategory({
      user: userId,
      category: data.category,
      amount: data.amount,
      month: data.month,
      year: data.year,
      description: data.description,
    });

    await expenseCategory.save();
    await this.monthlySummaryService.calculate(userId, data.month, data.year);

    return expenseCategory;
  }

  async getAll(userId: string, month?: number, year?: number): Promise<any[]> {
    const filter: any = { user: userId };

    if (month) filter.month = month;
    if (year) filter.year = year;

    const categories = await ExpenseCategory.find(filter).sort({ category: 1 });

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const allExpenses = await Expense.find({
        user: userId,
        date: { $gte: startDate, $lte: endDate },
      });

      const response = categories.map((cat) => {
        const matchingExpenses = allExpenses.filter(
          (e) => e.category === cat.category,
        );
        return {
          ...cat.toObject(),
          actualExpenses: matchingExpenses,
          expensesTotal: matchingExpenses.reduce((sum, e) => sum + e.amount, 0),
        };
      });

      const bucketCategoryNames = new Set(categories.map((c) => c.category));
      allExpenses.forEach((exp) => {
        if (!bucketCategoryNames.has(exp.category)) {
          let virtualCat = response.find(
            (r: any) => r.category === exp.category && r._id === undefined,
          );
          if (!virtualCat) {
            const newVirtualCat = {
              category: exp.category,
              amount: 0,
              month,
              year,
              actualExpenses: [exp],
              expensesTotal: exp.amount,
              isVirtual: true,
            } as any;
            response.push(newVirtualCat);
          } else {
            virtualCat.actualExpenses.push(exp);
            virtualCat.expensesTotal += exp.amount;
          }
        }
      });

      return response;
    }

    return categories;
  }

  async getBreakdown(
    userId: string,
    month: number,
    year: number,
  ): Promise<any> {
    const categories = await ExpenseCategory.find({
      user: userId,
      month,
      year,
    });

    const breakdown = {
      Transportation: 0,
      Repair: 0,
      Equipment: 0,
      total: 0,
    };

    categories.forEach((cat) => {
      if (cat.category in breakdown) {
        (breakdown as any)[cat.category] += cat.amount;
      }
      breakdown.total += cat.amount;
    });

    return {
      month,
      year,
      breakdown,
      details: categories,
    };
  }

  async update(
    userId: string,
    categoryId: string,
    data: UpdateExpenseCategoryDTO,
  ): Promise<IExpenseCategory> {
    const expenseCategory = await ExpenseCategory.findOne({
      _id: categoryId,
      user: userId,
    });

    if (!expenseCategory) {
      throw new NotFoundError("Expense category not found");
    }

    const oldMonth = expenseCategory.month;
    const oldYear = expenseCategory.year;

    if (data.category !== undefined) expenseCategory.category = data.category;
    if (data.amount !== undefined) {
      if (data.amount < 0) {
        throw new ValidationError("Amount cannot be negative");
      }
      expenseCategory.amount = data.amount;
    }
    if (data.month !== undefined) expenseCategory.month = data.month;
    if (data.year !== undefined) expenseCategory.year = data.year;
    if (data.description !== undefined)
      expenseCategory.description = data.description;

    await expenseCategory.save();

    await this.monthlySummaryService.calculate(
      userId,
      expenseCategory.month,
      expenseCategory.year,
    );
    if (
      oldMonth !== expenseCategory.month ||
      oldYear !== expenseCategory.year
    ) {
      await this.monthlySummaryService.calculate(userId, oldMonth, oldYear);
    }

    return expenseCategory;
  }

  async delete(userId: string, categoryId: string): Promise<void> {
    const expenseCategory = await ExpenseCategory.findOne({
      _id: categoryId,
      user: userId,
    });

    if (!expenseCategory) {
      throw new NotFoundError("Expense category not found");
    }

    const { month, year } = expenseCategory;
    await ExpenseCategory.findByIdAndDelete(categoryId);
    await this.monthlySummaryService.calculate(userId, month, year);
  }

  async getUniqueCategories(userId: string): Promise<string[]> {
    return await ExpenseCategory.distinct("category", { user: userId });
  }

  async copyFromPreviousMonth(
    userId: string,
    month: number,
    year: number,
  ): Promise<IExpenseCategory[]> {
    // Calculate previous month and year
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }

    // Check if categories already exist for target month
    const existingCount = await ExpenseCategory.countDocuments({
      user: userId,
      month,
      year,
    });
    if (existingCount > 0) {
      throw new ValidationError("Categories already exist for this month");
    }

    // Get categories from previous month, if any
    const prevCategories = await ExpenseCategory.find({
      user: userId,
      month: prevMonth,
      year: prevYear,
    });

    let result: IExpenseCategory[];

    if (prevCategories.length > 0) {
      // Copy explicit category buckets but reset amount to 0
      const newCategories = prevCategories.map((cat) => {
        const { _id, __v, createdAt, amount, ...rest } = cat.toObject() as any;
        return {
          ...rest,
          amount: 0,
          month,
          year,
        };
      });

      result = (await ExpenseCategory.insertMany(
        newCategories,
      )) as unknown as IExpenseCategory[];
    } else {
      // No explicit buckets – fall back to previous month's expenses,
      // grouping by category and using the total spend as the new bucket amount.
      const startDate = new Date(prevYear, prevMonth - 1, 1);
      const endDate = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);

      const prevExpenses = await Expense.find({
        user: userId,
        date: { $gte: startDate, $lte: endDate },
      });

      if (prevExpenses.length === 0) {
        throw new NotFoundError(
          "No categories or expenses found in previous month to copy",
        );
      }

      const totalsByCategory = prevExpenses.reduce(
        (acc: Record<string, number>, exp) => {
          if (!exp.category) return acc;
          acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
          return acc;
        },
        {},
      );

      const newCategoriesFromExpenses = Object.entries(totalsByCategory).map(
        ([category]) => ({
          user: userId,
          category,
          amount: 0,
          month,
          year,
        }),
      );

      result = (await ExpenseCategory.insertMany(
        newCategoriesFromExpenses,
      )) as unknown as IExpenseCategory[];
    }

    // Trigger summary recalculation for the current month
    await this.monthlySummaryService.calculate(userId, month, year);

    return result;
  }
}
