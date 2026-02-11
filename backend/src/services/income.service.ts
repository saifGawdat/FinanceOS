import { Income, IIncome } from "../models/Income";
import { CreateIncomeDTO } from "../dtos/income.dto";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { NotFoundError, UnauthorizedError } from "../errors";
import { MonthlySummaryService } from "./monthly-summary.service";

export class IncomeService {
  private monthlySummaryService = new MonthlySummaryService();

  async create(userId: string, data: CreateIncomeDTO): Promise<IIncome> {
    const income = new Income({
      user: userId,
      title: data.title,
      amount: data.amount,
      category: data.category,
      date: data.date || new Date(),
      description: data.description,
      customer: data.customer,
    });

    await income.save();

    // Trigger summary recalculation
    const d = new Date(income.date);
    await this.monthlySummaryService.calculate(
      userId,
      d.getMonth() + 1,
      d.getFullYear(),
    );

    return income;
  }

  async getAll(
    userId: string,
    month?: number,
    year?: number,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponseDTO<IIncome>> {
    const query: any = { user: userId };

    const validatedPage = page < 1 ? 1 : page;
    const validatedLimit = limit < 1 ? 10 : limit > 100 ? 100 : limit;
    const skip = (validatedPage - 1) * validatedLimit;

    if (month && year) {
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      query.date = { $gte: startDate, $lte: endDate };
    }

    const totalItems = await Income.countDocuments(query);
    const totalPages = Math.ceil(totalItems / validatedLimit);

    const incomes = await Income.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(validatedLimit)
      .lean();

    return {
      data: incomes as IIncome[],
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

  async delete(userId: string, incomeId: string): Promise<void> {
    const income = await Income.findById(incomeId);

    if (!income) {
      throw new NotFoundError("Income not found");
    }

    if (income.user.toString() !== userId) {
      throw new UnauthorizedError("Not authorized");
    }

    const d = new Date(income.date);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    await Income.findByIdAndDelete(incomeId);

    // Trigger summary recalculation
    await this.monthlySummaryService.calculate(userId, month, year);
  }
}
