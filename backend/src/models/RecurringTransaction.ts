import mongoose, { Document, Schema } from "mongoose";

export type RecurringType = "income" | "expense";

export interface IRecurringTransaction extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  type: RecurringType;
  category: string;
  dayOfMonth: number; // 1–28
  description?: string;
  isActive: boolean;
  processedMonths: { month: number; year: number }[];
  createdAt: Date;
}

const recurringTransactionSchema = new Schema<IRecurringTransaction>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0, "Amount cannot be negative"],
  },
  type: {
    type: String,
    enum: ["income", "expense"],
    required: [true, "Type is required (income or expense)"],
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    trim: true,
  },
  dayOfMonth: {
    type: Number,
    required: [true, "Day of month is required"],
    min: [1, "Day must be at least 1"],
    max: [28, "Day must be at most 28"],
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  processedMonths: [
    {
      month: { type: Number, required: true },
      year: { type: Number, required: true },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

recurringTransactionSchema.index({ user: 1, type: 1 });

export const RecurringTransaction = mongoose.model<IRecurringTransaction>(
  "RecurringTransaction",
  recurringTransactionSchema,
);
