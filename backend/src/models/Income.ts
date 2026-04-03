import mongoose, { Document, Schema } from "mongoose";

export interface IIncome extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  category: string;
  date: Date;
  description?: string;
  customer?: mongoose.Types.ObjectId;
  isRecurring?: boolean;
  recurringId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const incomeSchema = new Schema<IIncome>({
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
    default: "Other",
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
  customer: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
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

incomeSchema.index({ user: 1, date: -1 });

export const Income = mongoose.model<IIncome>("Income", incomeSchema);
