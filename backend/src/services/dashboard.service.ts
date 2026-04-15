import { Income } from "../models/Income";
import { Expense } from "../models/Expense";
import { Employee } from "../models/Employee";
import { ExpenseCategory } from "../models/ExpenseCategory";
import { EmployeeTransaction } from "../models/EmployeeTransaction";
import { Invoice } from "../models/Invoice";

const deriveInvoiceStatus = (invoice: any) => {
  if (invoice.cancelledAt || invoice.status === "cancelled") return "cancelled";
  if (Number(invoice.balanceDue || 0) <= 0 && Number(invoice.total || 0) > 0) {
    return "paid";
  }
  if (Number(invoice.amountPaid || 0) > 0) {
    return new Date(invoice.dueDate) < new Date() ? "overdue" : "partially_paid";
  }
  if (!invoice.sentAt) return "draft";
  return new Date(invoice.dueDate) < new Date() ? "overdue" : "sent";
};

export class DashboardService {
  async getStats(userId: string, month?: number, year?: number): Promise<any> {
    const query: any = { user: userId };

    if (month && year) {
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      query.date = { $gte: startDate, $lte: endDate };
    }

    const [incomes, expenses] = await Promise.all([
      Income.find(query),
      Expense.find(query),
    ]);

    let totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    if (month && year) {
      const [categories, employees, transactions] = await Promise.all([
        ExpenseCategory.find({ user: userId, month, year }),
        Employee.find({ user: userId, isActive: true }),
        EmployeeTransaction.find({ user: userId, month, year }),
      ]);

      totalExpense += categories.reduce((sum, cat) => sum + cat.amount, 0);

      const totalSalaries =
        employees.reduce((sum, emp) => sum + emp.salary, 0) +
        transactions
          .filter((t) => t.type === "BONUS")
          .reduce((sum, t) => sum + t.amount, 0) -
        transactions
          .filter((t) => t.type === "DEDUCTION")
          .reduce((sum, t) => sum + t.amount, 0);

      totalExpense += totalSalaries;
    }

    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const balance = totalIncome - totalExpense;
    const allInvoices = await Invoice.find({ user: userId }).lean();
    const normalizedInvoices = allInvoices.map((invoice) => ({
      ...invoice,
      status: deriveInvoiceStatus(invoice),
    }));
    const openInvoices = normalizedInvoices.filter((invoice) =>
      ["sent", "partially_paid", "overdue"].includes(invoice.status),
    );
    const overdueInvoices = normalizedInvoices.filter(
      (invoice) => invoice.status === "overdue",
    );

    return {
      totalIncome,
      totalExpense,
      balance,
      incomeCount: incomes.length,
      expenseCount: expenses.length,
      receivables: openInvoices.reduce(
        (sum, invoice) => sum + invoice.balanceDue,
        0,
      ),
      overdueReceivables: overdueInvoices.reduce(
        (sum, invoice) => sum + invoice.balanceDue,
        0,
      ),
      overdueInvoiceCount: overdueInvoices.length,
    };
  }

  async getChartData(
    userId: string,
    month?: number,
    year?: number,
  ): Promise<any> {
    if (month && year) {
      return this.getMonthlyChartData(userId, month, year);
    } else {
      return this.getAllTimeChartData(userId);
    }
  }

  private async getMonthlyChartData(
    userId: string,
    month: number,
    year: number,
  ): Promise<any> {
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const startOf6Months = new Date(year, month - 6, 1);

    const [
      incomes,
      expenses,
      sixMonthIncomes,
      sixMonthExpenses,
      expenseCategories,
      employees,
      transactions,
    ] = await Promise.all([
      Income.find({
        user: userId,
        date: { $gte: startDate, $lte: endDate },
      }).sort({ date: 1 }),
      Expense.find({
        user: userId,
        date: { $gte: startDate, $lte: endDate },
      }).sort({ date: 1 }),
      Income.find({
        user: userId,
        date: { $gte: startOf6Months, $lte: endDate },
      }),
      Expense.find({
        user: userId,
        date: { $gte: startOf6Months, $lte: endDate },
      }),
      ExpenseCategory.find({ user: userId, month, year }),
      Employee.find({ user: userId, isActive: true }),
      EmployeeTransaction.find({ user: userId, month, year }),
    ]);

    // Daily timeline data
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyTimelineData = [];

    // Pre-calculate date strings for optimization
    const incomeDatesMap: Record<number, any[]> = {};
    const expenseDatesMap: Record<number, any[]> = {};

    incomes.forEach((inc) => {
      const day = new Date(inc.date).getDate();
      if (!incomeDatesMap[day]) incomeDatesMap[day] = [];
      incomeDatesMap[day].push(inc);
    });

    expenses.forEach((exp) => {
      const day = new Date(exp.date).getDate();
      if (!expenseDatesMap[day]) expenseDatesMap[day] = [];
      expenseDatesMap[day].push(exp);
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${new Date(year, month - 1, day).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric" },
      )}`;

      const dayIncomes = incomeDatesMap[day] || [];
      const dayExpenses = expenseDatesMap[day] || [];

      dailyTimelineData.push({
        date: dateStr,
        income: dayIncomes.reduce((sum, inc) => sum + inc.amount, 0),
        expense: dayExpenses.reduce((sum, exp) => sum + exp.amount, 0),
      });
    }

    const monthlyData: any = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(year, month - 1 - i, 1);
      const mStr = d.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      monthlyData[mStr] = {
        month: mStr,
        income: 0,
        expense: 0,
        sortKey: d.getTime(),
      };
    }

    sixMonthIncomes.forEach((inc) => {
      const mStr = new Date(inc.date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      if (monthlyData[mStr]) monthlyData[mStr].income += inc.amount;
    });
    sixMonthExpenses.forEach((exp) => {
      const mStr = new Date(exp.date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      if (monthlyData[mStr]) monthlyData[mStr].expense += exp.amount;
    });

    const barChartData = Object.values(monthlyData).sort(
      (a: any, b: any) => a.sortKey - b.sortKey,
    );

    const pieDataMap: any = {};

    const salaryTotal =
      employees.reduce((sum, emp) => sum + emp.salary, 0) +
      transactions
        .filter((t) => t.type === "BONUS")
        .reduce((sum, t) => sum + t.amount, 0) -
      transactions
        .filter((t) => t.type === "DEDUCTION")
        .reduce((sum, t) => sum + t.amount, 0);

    if (salaryTotal > 0) {
      pieDataMap["Salaries (Net)"] = salaryTotal;
    }

    expenseCategories.forEach((cat) => {
      pieDataMap[cat.category] = (pieDataMap[cat.category] || 0) + cat.amount;
    });

    expenses.forEach((exp) => {
      pieDataMap[exp.category] = (pieDataMap[exp.category] || 0) + exp.amount;
    });

    const pieChartData = Object.keys(pieDataMap)
      .map((name) => ({ name, value: pieDataMap[name] }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    // Income breakdown by category
    const incomePieDataMap: any = {};
    incomes.forEach((inc) => {
      const cat = inc.category || "Other";
      incomePieDataMap[cat] = (incomePieDataMap[cat] || 0) + inc.amount;
    });

    const incomePieChartData = Object.keys(incomePieDataMap)
      .map((name) => ({ name, value: incomePieDataMap[name] }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return {
      barChartData,
      pieChartData,
      lineChartData: dailyTimelineData,
      incomePieChartData,
    };
  }

  private async getAllTimeChartData(userId: string): Promise<any> {
    const incomes = await Income.find({ user: userId }).sort({ date: 1 });
    const expenses = await Expense.find({ user: userId }).sort({ date: 1 });

    const monthlyData: any = {};
    incomes.forEach((income) => {
      const month = new Date(income.date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, income: 0, expense: 0 };
      }
      monthlyData[month].income += income.amount;
    });

    expenses.forEach((expense) => {
      const month = new Date(expense.date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, income: 0, expense: 0 };
      }
      monthlyData[month].expense += expense.amount;
    });

    const barChartData = Object.values(monthlyData);

    const categoryData: any = {};
    expenses.forEach((expense) => {
      if (!categoryData[expense.category]) {
        categoryData[expense.category] = 0;
      }
      categoryData[expense.category] += expense.amount;
    });

    const pieChartData = Object.keys(categoryData).map((category) => ({
      name: category,
      value: categoryData[category],
    }));

    const timelineData = [...incomes, ...expenses]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc: any[], item) => {
        const date = new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const existingEntry = acc.find((entry) => entry.date === date);

        const isIncome = "customer" in item; // Income has customer field

        if (existingEntry) {
          if (isIncome) {
            existingEntry.income += item.amount;
          } else {
            existingEntry.expense += item.amount;
          }
        } else {
          acc.push({
            date,
            income: isIncome ? item.amount : 0,
            expense: isIncome ? 0 : item.amount,
          });
        }
        return acc;
      }, []);

    const incomePieDataMap: any = {};
    incomes.forEach((inc) => {
      const cat = inc.category || "Other";
      incomePieDataMap[cat] = (incomePieDataMap[cat] || 0) + inc.amount;
    });

    const incomePieChartData = Object.keys(incomePieDataMap).map((name) => ({
      name,
      value: incomePieDataMap[name],
    }));

    return {
      barChartData,
      pieChartData,
      lineChartData: timelineData,
      incomePieChartData,
    };
  }

  async getRecentTransactions(
    userId: string,
    month?: number,
    year?: number,
  ): Promise<any[]> {
    const query: any = { user: userId };

    if (month && year) {
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      query.date = { $gte: startDate, $lte: endDate };
    }

    const [incomes, expenses] = await Promise.all([
      Income.find(query).sort({ createdAt: -1 }).limit(10),
      Expense.find(query).sort({ createdAt: -1 }).limit(10),
    ]);

    const transactions = [
      ...incomes.map((income) => ({ ...income.toObject(), type: "income" })),
      ...expenses.map((expense) => ({
        ...expense.toObject(),
        type: "expense",
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);

    return transactions;
  }

  async getReceivables(userId: string): Promise<any> {
    const invoices = await Invoice.find({ user: userId })
      .populate("customer", "name brandName")
      .sort({ dueDate: 1 })
      .lean();

    const normalizedInvoices = invoices.map((invoice) => ({
      ...invoice,
      status: deriveInvoiceStatus(invoice),
    }));

    const open = normalizedInvoices.filter((invoice) =>
      ["sent", "partially_paid", "overdue"].includes(invoice.status),
    );
    const overdue = normalizedInvoices.filter(
      (invoice) => invoice.status === "overdue",
    );

    const topOverdueCustomers = overdue.reduce(
      (map: Record<string, number>, invoice: any) => {
        const customerName = invoice.customer?.brandName
          ? `${invoice.customer.name} (${invoice.customer.brandName})`
          : invoice.customer?.name || "Unknown";
        map[customerName] = (map[customerName] || 0) + invoice.balanceDue;
        return map;
      },
      {},
    );

    return {
      totalReceivables: open.reduce((sum, invoice) => sum + invoice.balanceDue, 0),
      overdueReceivables: overdue.reduce(
        (sum, invoice) => sum + invoice.balanceDue,
        0,
      ),
      openInvoiceCount: open.length,
      overdueInvoiceCount: overdue.length,
      topOverdueCustomers: Object.entries(topOverdueCustomers)
        .map(([customerName, balanceDue]) => ({ customerName, balanceDue }))
        .sort((a, b) => Number(b.balanceDue) - Number(a.balanceDue))
        .slice(0, 5),
    };
  }
}
