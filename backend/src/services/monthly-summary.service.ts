import { MonthlySummary, IMonthlySummary } from "../models/MonthlySummary";
import { Income } from "../models/Income";
import { Expense } from "../models/Expense";
import { ExpenseCategory } from "../models/ExpenseCategory";
import { Employee } from "../models/Employee";
import { EmployeeTransaction } from "../models/EmployeeTransaction";

export class MonthlySummaryService {
  async get(
    userId: string,
    month: number,
    year: number,
  ): Promise<IMonthlySummary> {
    let summary = await MonthlySummary.findOne({ user: userId, month, year });

    if (!summary) {
      const calculated = await this.calculate(userId, month, year);
      return calculated as IMonthlySummary;
    }

    return summary as IMonthlySummary;
  }

  async getAll(userId: string): Promise<IMonthlySummary[]> {
    return await MonthlySummary.find({ user: userId }).sort({
      year: -1,
      month: -1,
    });
  }

  async recalculate(
    userId: string,
    month: number,
    year: number,
  ): Promise<IMonthlySummary> {
    return await this.calculate(userId, month, year);
  }

  async calculate(
    userId: string,
    month: number,
    year: number,
  ): Promise<IMonthlySummary> {
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Calculate Total Income
    const incomes = await Income.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    });
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

    // Calculate Total Expenses
    const expenses = await Expense.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    });
    const regularExpensesTotal = expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );

    const expenseCategories = await ExpenseCategory.find({
      user: userId,
      month,
      year,
    });
    const categoryExpensesTotal = expenseCategories.reduce(
      (sum, cat) => sum + cat.amount,
      0,
    );

    const totalExpenses = regularExpensesTotal + categoryExpensesTotal;

    // Calculate Total Salaries
    const activeEmployees = await Employee.find({
      user: userId,
      isActive: true,
    });
    const totalBaseSalary = activeEmployees.reduce(
      (sum, emp) => sum + emp.salary,
      0,
    );

    const transactions = await EmployeeTransaction.find({
      user: userId,
      month,
      year,
      employee: { $in: activeEmployees.map((emp) => emp._id) },
    });
    const totalBonuses = transactions
      .filter((t) => t.type === "BONUS")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDeductions = transactions
      .filter((t) => t.type === "DEDUCTION")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSalaries = totalBaseSalary + totalBonuses - totalDeductions;

    // Calculate Profit
    const profit = totalIncome - totalExpenses - totalSalaries;

    // Build breakdown
    const expenseBreakdown = {
      Transportation: 0,
      Repair: 0,
      Equipment: 0,
      regularExpenses: regularExpensesTotal,
    };

    expenseCategories.forEach((cat) => {
      if (cat.category in expenseBreakdown) {
        (expenseBreakdown as any)[cat.category] += cat.amount;
      }
    });

    // Update or create summary
    const summary = await MonthlySummary.findOneAndUpdate(
      { user: userId, month, year },
      {
        totalIncome,
        totalExpenses,
        totalSalaries,
        profit,
        expenseBreakdown,
        incomeBreakdown: {
          monthlyCollections: totalIncome,
          advertisingExpenses: 0,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return summary!;
  }
}
