import mongoose, { Document, Schema } from "mongoose";

export interface IExpense extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  category: string;
  date: Date;
  description?: string;
  isRecurring?: boolean;
  recurringId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const expenseSchema = new Schema<IExpense>({
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
    min: 0,
  },
  category: {
    type: String,
    required: [true, "Category is required"],
  },
  date: {
    type: Date,
    required: [true, "Date is required"],
    default: Date.now,
  },
  description: {
    type: String,
    trim: true,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurringId: {
    type: Schema.Types.ObjectId,
    ref: "RecurringTransaction",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

expenseSchema.index({ user: 1, date: -1 });

export const Expense = mongoose.model<IExpense>("Expense", expenseSchema);
