import {
  RecurringTransaction,
  IRecurringTransaction,
  RecurringType,
} from "../models/RecurringTransaction";
import { NotFoundError, ValidationError } from "../errors";

export interface CreateRecurringDTO {
  title: string;
  amount: number;
  type: RecurringType;
  category: string;
  dayOfMonth: number;
  description?: string;
}

export interface UpdateRecurringDTO {
  title?: string;
  amount?: number;
  category?: string;
  dayOfMonth?: number;
  description?: string;
}

export class RecurringService {
  async getAll(userId: string): Promise<IRecurringTransaction[]> {
    return RecurringTransaction.find({ user: userId }).sort({ createdAt: -1 });
  }

  async create(
    userId: string,
    data: CreateRecurringDTO,
  ): Promise<IRecurringTransaction> {
    if (data.amount < 0) throw new ValidationError("Amount cannot be negative");
    if (data.dayOfMonth < 1 || data.dayOfMonth > 28)
      throw new ValidationError("Day of month must be between 1 and 28");

    const item = new RecurringTransaction({ user: userId, ...data });
    await item.save();
    return item;
  }

  async update(
    userId: string,
    id: string,
    data: UpdateRecurringDTO,
  ): Promise<IRecurringTransaction> {
    const item = await RecurringTransaction.findOne({ _id: id, user: userId });
    if (!item) throw new NotFoundError("Recurring transaction not found");

    if (data.amount !== undefined && data.amount < 0)
      throw new ValidationError("Amount cannot be negative");
    if (
      data.dayOfMonth !== undefined &&
      (data.dayOfMonth < 1 || data.dayOfMonth > 28)
    )
      throw new ValidationError("Day of month must be between 1 and 28");

    if (data.title !== undefined) item.title = data.title;
    if (data.amount !== undefined) item.amount = data.amount;
    if (data.category !== undefined) item.category = data.category;
    if (data.dayOfMonth !== undefined) item.dayOfMonth = data.dayOfMonth;
    if (data.description !== undefined) item.description = data.description;

    await item.save();
    return item;
  }

  async toggleActive(
    userId: string,
    id: string,
  ): Promise<IRecurringTransaction> {
    const item = await RecurringTransaction.findOne({ _id: id, user: userId });
    if (!item) throw new NotFoundError("Recurring transaction not found");

    item.isActive = !item.isActive;
    await item.save();
    return item;
  }

  async delete(userId: string, id: string): Promise<void> {
    const item = await RecurringTransaction.findOne({ _id: id, user: userId });
    if (!item) throw new NotFoundError("Recurring transaction not found");

    await RecurringTransaction.findByIdAndDelete(id);
  }
}
