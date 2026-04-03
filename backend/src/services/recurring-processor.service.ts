import { RecurringTransaction } from "../models/RecurringTransaction";
import { Income } from "../models/Income";
import { Expense } from "../models/Expense";
import { MonthlySummaryService } from "./monthly-summary.service";

export class RecurringProcessorService {
  private monthlySummaryService = new MonthlySummaryService();

  async processAll(): Promise<void> {
    console.log("Starting recurring transactions processing...");
    
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    try {
      // Find all active recurring transactions that are due today
      const activeRecurring = await RecurringTransaction.find({
        isActive: true,
        dayOfMonth: { $lte: currentDay }, // Process anything due up to today just in case
      });

      console.log(`Found ${activeRecurring.length} potential recurring transactions to process.`);

      for (const item of activeRecurring) {
        // Check if already processed for this month/year
        const alreadyProcessed = item.processedMonths.some(
          (p) => p.month === currentMonth && p.year === currentYear
        );

        if (alreadyProcessed) continue;

        console.log(`Processing recurring item: ${item.title} for user: ${item.user}`);

        // Create the actual transaction
        if (item.type === "income") {
          const income = new Income({
            user: item.user,
            title: `${item.title} (Auto)`,
            amount: item.amount,
            category: item.category,
            date: today,
            description: item.description || `Auto-generated from recurring: ${item.title}`,
            isRecurring: true,
            recurringId: item._id,
          });
          await income.save();
        } else {
          const expense = new Expense({
            user: item.user,
            title: `${item.title} (Auto)`,
            amount: item.amount,
            category: item.category,
            date: today,
            description: item.description || `Auto-generated from recurring: ${item.title}`,
            isRecurring: true,
            recurringId: item._id,
          });
          await expense.save();
        }

        // Mark as processed
        item.processedMonths.push({ month: currentMonth, year: currentYear });
        await item.save();

        // Trigger recalculation for the summary
        await this.monthlySummaryService.calculate(
          item.user.toString(),
          currentMonth,
          currentYear
        );

        console.log(`Successfully processed recurring item: ${item.title}`);
      }

      console.log("Finished recurring transactions processing.");
    } catch (error) {
      console.error("Error processing recurring transactions:", error);
    }
  }
}
