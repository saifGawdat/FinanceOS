import mongoose, { Document, Schema } from "mongoose";

export interface IGoal extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<IGoal>({
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
  targetAmount: {
    type: Number,
    required: [true, "Target amount is required"],
    min: 0,
    },
  currentAmount: {
    type: Number,
    required: [false, "Current amount is required"],
    min: 0,
    default: 0,
  },
  targetDate: {
    type: Date,
    required: false,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

goalSchema.index({ user: 1, targetDate: 1 });

export const Goal = mongoose.model<IGoal>("Goal", goalSchema);