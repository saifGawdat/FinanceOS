import { Expense, IExpense } from "../models/Expense";
import { CreateExpenseDTO } from "../dtos/expense.dto";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { NotFoundError, UnauthorizedError } from "../errors";
import { MonthlySummaryService } from "./monthly-summary.service";

export class ExpenseService {
  private monthlySummaryService = new MonthlySummaryService();

  async create(userId: string, data: CreateExpenseDTO): Promise<IExpense> {
    const expense = new Expense({
      user: userId,
      title: data.title,
      amount: data.amount,
      category: data.category,
      date: data.date || new Date(),
      description: data.description,
    });

    await expense.save();

    // Trigger summary recalculation
    const d = new Date(expense.date);
    await this.monthlySummaryService.calculate(
      userId,
      d.getMonth() + 1,
      d.getFullYear(),
    );

    return expense;
  }

  async getAll(
    userId: string,
    month?: number,
    year?: number,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponseDTO<IExpense>> {
    const query: any = { user: userId };

    const validatedPage = page < 1 ? 1 : page;
    const validatedLimit = limit < 1 ? 10 : limit > 100 ? 100 : limit;
    const skip = (validatedPage - 1) * validatedLimit;

    if (month && year) {
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      query.date = { $gte: startDate, $lte: endDate };
    }

    const totalItems = await Expense.countDocuments(query);
    const totalPages = Math.ceil(totalItems / validatedLimit);

    const expenses = await Expense.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(validatedLimit)
      .lean();

    return {
      data: expenses as IExpense[],
      pagination: {
        currentPage: validatedPage,
        totalPages,
        totalItems,
        itemsPerPage: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPreviousPage: validatedPage > 1,
      },
    };
  }

  async delete(userId: string, expenseId: string): Promise<void> {
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      throw new NotFoundError("Expense not found");
    }

    if (expense.user.toString() !== userId) {
      throw new UnauthorizedError("Not authorized");
    }

    const d = new Date(expense.date);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    await Expense.findByIdAndDelete(expenseId);

    // Trigger summary recalculation
    await this.monthlySummaryService.calculate(userId, month, year);
  }
}
