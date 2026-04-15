import mongoose, { Document, Schema } from "mongoose";

export interface IInvoicePayment extends Document {
  user: mongoose.Types.ObjectId;
  invoice: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  income?: mongoose.Types.ObjectId;
  amount: number;
  paymentDate: Date;
  method: string;
  reference?: string;
  notes?: string;
  recordedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invoicePaymentSchema = new Schema<IInvoicePayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    income: {
      type: Schema.Types.ObjectId,
      ref: "Income",
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    method: {
      type: String,
      required: true,
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

invoicePaymentSchema.index({ user: 1, invoice: 1, paymentDate: -1 });

export const InvoicePayment = mongoose.model<IInvoicePayment>(
  "InvoicePayment",
  invoicePaymentSchema,
);
