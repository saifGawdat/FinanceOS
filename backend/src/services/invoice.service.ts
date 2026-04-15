import mongoose from "mongoose";
import { Customer } from "../models/Customer";
import { Income } from "../models/Income";
import { Invoice, IInvoice, InvoiceStatus } from "../models/Invoice";
import { InvoicePayment, IInvoicePayment } from "../models/InvoicePayment";
import {
  CreateInvoiceDTO,
  RecordInvoicePaymentDTO,
  UpdateInvoiceDTO,
} from "../dtos/invoice.dto";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../errors";
import { MonthlySummaryService } from "./monthly-summary.service";

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export class InvoiceService {
  private monthlySummaryService = new MonthlySummaryService();

  private ensureObjectId(id: string, message: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError(message);
    }
  }

  private normalizeLineItems(
    lineItems: CreateInvoiceDTO["lineItems"],
  ): IInvoice["lineItems"] {
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      throw new ValidationError("At least one line item is required");
    }

    return lineItems.map((item) => {
      const description = item.description?.trim();
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      if (!description) {
        throw new ValidationError("Each line item needs a description");
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new ValidationError("Line item quantity must be greater than zero");
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new ValidationError("Line item unit price must be zero or greater");
      }

      return {
        description,
        quantity,
        unitPrice,
        total: roundMoney(quantity * unitPrice),
      };
    }) as IInvoice["lineItems"];
  }

  private calculateTotals(
    lineItems: IInvoice["lineItems"],
    tax = 0,
    discount = 0,
  ) {
    const normalizedTax = roundMoney(Number(tax || 0));
    const normalizedDiscount = roundMoney(Number(discount || 0));

    if (normalizedTax < 0 || normalizedDiscount < 0) {
      throw new ValidationError("Tax and discount must be zero or greater");
    }

    const subtotal = roundMoney(
      lineItems.reduce((sum, item) => sum + Number(item.total || 0), 0),
    );
    const total = roundMoney(subtotal + normalizedTax - normalizedDiscount);

    if (total < 0) {
      throw new ValidationError("Invoice total cannot be negative");
    }

    return {
      subtotal,
      tax: normalizedTax,
      discount: normalizedDiscount,
      total,
    };
  }

  private deriveStatus(
    invoice: Pick<IInvoice, "status" | "dueDate" | "total"> & {
      amountPaid: number;
      balanceDue: number;
      sentAt?: Date | null;
      cancelledAt?: Date | null;
    },
  ): InvoiceStatus {
    if (invoice.cancelledAt || invoice.status === "cancelled") {
      return "cancelled";
    }

    const amountPaid = roundMoney(invoice.amountPaid || 0);
    const balanceDue = roundMoney(invoice.balanceDue || 0);

    if (balanceDue <= 0 && invoice.total > 0) {
      return "paid";
    }

    if (amountPaid > 0) {
      return startOfDay(invoice.dueDate) < startOfDay(new Date())
        ? "overdue"
        : "partially_paid";
    }

    if (!invoice.sentAt) {
      return "draft";
    }

    return startOfDay(invoice.dueDate) < startOfDay(new Date())
      ? "overdue"
      : "sent";
  }

  private async generateInvoiceNumber(userId: string) {
    const prefixDate = new Date();
    const year = prefixDate.getFullYear();
    const month = String(prefixDate.getMonth() + 1).padStart(2, "0");
    const baseCount = await Invoice.countDocuments({ user: userId });

    let attempt = baseCount + 1;
    while (attempt < baseCount + 1000) {
      const invoiceNumber = `INV-${year}${month}-${String(attempt).padStart(4, "0")}`;
      const existing = await Invoice.exists({ user: userId, invoiceNumber });
      if (!existing) {
        return invoiceNumber;
      }
      attempt += 1;
    }

    throw new ConflictError("Unable to generate a unique invoice number");
  }

  private async getOwnedCustomer(userId: string, customerId: string) {
    this.ensureObjectId(customerId, "Invalid customer id");
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new NotFoundError("Customer not found");
    }
    if (customer.user.toString() !== userId) {
      throw new UnauthorizedError("Not authorized");
    }

    return customer;
  }

  private async getOwnedInvoice(userId: string, invoiceId: string) {
    this.ensureObjectId(invoiceId, "Invalid invoice id");
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      throw new NotFoundError("Invoice not found");
    }
    if (invoice.user.toString() !== userId) {
      throw new UnauthorizedError("Not authorized");
    }

    return invoice;
  }

  private hydrateInvoice(invoiceId: string) {
    return Invoice.findById(invoiceId).populate(
      "customer",
      "name brandName phoneNumber monthlyAmount",
    );
  }

  async create(userId: string, data: CreateInvoiceDTO) {
    const customer = await this.getOwnedCustomer(userId, data.customerId);
    const lineItems = this.normalizeLineItems(data.lineItems);
    const totals = this.calculateTotals(lineItems, data.tax, data.discount);
    const issueDate = new Date(data.issueDate);
    const dueDate = new Date(data.dueDate);

    if (Number.isNaN(issueDate.getTime()) || Number.isNaN(dueDate.getTime())) {
      throw new ValidationError("Issue date and due date are required");
    }
    if (dueDate < issueDate) {
      throw new ValidationError("Due date cannot be before the issue date");
    }

    const invoice = new Invoice({
      user: userId,
      customer: customer._id,
      invoiceNumber: await this.generateInvoiceNumber(userId),
      issueDate,
      dueDate,
      currency: (data.currency || "GBP").toUpperCase(),
      lineItems,
      ...totals,
      amountPaid: 0,
      balanceDue: totals.total,
      notes: data.notes?.trim() || undefined,
      status: "draft",
    });

    await invoice.save();
    return this.hydrateInvoice(invoice._id.toString());
  }

  async getAll(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      customerId?: string;
      status?: string;
      month?: number;
      year?: number;
      search?: string;
    },
  ): Promise<PaginatedResponseDTO<any>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 10;
    const dbQuery: any = { user: userId };

    if (query.customerId) {
      this.ensureObjectId(query.customerId, "Invalid customer filter");
      dbQuery.customer = query.customerId;
    }

    if (query.month && query.year) {
      dbQuery.issueDate = {
        $gte: new Date(Date.UTC(query.year, query.month - 1, 1, 0, 0, 0, 0)),
        $lte: new Date(Date.UTC(query.year, query.month, 0, 23, 59, 59, 999)),
      };
    }

    if (query.search?.trim()) {
      const regex = new RegExp(query.search.trim(), "i");
      const customers = await Customer.find({
        user: userId,
        $or: [{ name: regex }, { brandName: regex }],
      }).select("_id");

      dbQuery.$or = [
        { invoiceNumber: regex },
        { notes: regex },
        { customer: { $in: customers.map((customer) => customer._id) } },
      ];
    }

    const invoices = await Invoice.find(dbQuery)
      .populate("customer", "name brandName phoneNumber monthlyAmount")
      .sort({ dueDate: 1, createdAt: -1 });

    const filtered = invoices
      .map((invoice) => {
        const serialized = invoice.toObject() as any;
        serialized.status = this.deriveStatus(invoice as any);
        return serialized;
      })
      .filter((invoice) => !query.status || invoice.status === query.status);

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const startIndex = (page - 1) * limit;

    return {
      data: filtered.slice(startIndex, startIndex + limit),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getById(userId: string, invoiceId: string) {
    const invoice = await this.getOwnedInvoice(userId, invoiceId);
    const hydrated = await this.hydrateInvoice(invoice._id.toString());
    const payments = await InvoicePayment.find({
      user: userId,
      invoice: invoice._id,
    })
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    return {
      invoice: hydrated,
      payments,
    };
  }

  async update(userId: string, invoiceId: string, data: UpdateInvoiceDTO) {
    const invoice = await this.getOwnedInvoice(userId, invoiceId);

    if (invoice.cancelledAt) {
      throw new ValidationError("Cancelled invoices cannot be edited");
    }
    if (invoice.amountPaid > 0) {
      throw new ValidationError("Invoices with recorded payments cannot be edited");
    }

    if (data.issueDate !== undefined) {
      const issueDate = new Date(data.issueDate);
      if (Number.isNaN(issueDate.getTime())) {
        throw new ValidationError("Invalid issue date");
      }
      invoice.issueDate = issueDate;
    }

    if (data.dueDate !== undefined) {
      const dueDate = new Date(data.dueDate);
      if (Number.isNaN(dueDate.getTime())) {
        throw new ValidationError("Invalid due date");
      }
      invoice.dueDate = dueDate;
    }

    if (invoice.dueDate < invoice.issueDate) {
      throw new ValidationError("Due date cannot be before the issue date");
    }

    if (data.currency !== undefined) {
      invoice.currency = data.currency.toUpperCase();
    }
    if (data.lineItems !== undefined) {
      invoice.lineItems = this.normalizeLineItems(data.lineItems);
    }
    if (data.tax !== undefined) {
      invoice.tax = roundMoney(Number(data.tax));
    }
    if (data.discount !== undefined) {
      invoice.discount = roundMoney(Number(data.discount));
    }
    if (data.notes !== undefined) {
      invoice.notes = data.notes?.trim() || undefined;
    }

    const totals = this.calculateTotals(invoice.lineItems, invoice.tax, invoice.discount);
    invoice.subtotal = totals.subtotal;
    invoice.tax = totals.tax;
    invoice.discount = totals.discount;
    invoice.total = totals.total;
    invoice.balanceDue = totals.total;
    invoice.status = this.deriveStatus(invoice as any);

    await invoice.save();
    return this.hydrateInvoice(invoice._id.toString());
  }

  async markAsSent(userId: string, invoiceId: string) {
    const invoice = await this.getOwnedInvoice(userId, invoiceId);

    if (invoice.cancelledAt) {
      throw new ValidationError("Cancelled invoices cannot be sent");
    }

    if (!invoice.sentAt) {
      invoice.sentAt = new Date();
    }
    invoice.status = this.deriveStatus({
      ...invoice.toObject(),
      sentAt: invoice.sentAt,
    } as any);
    await invoice.save();

    return this.hydrateInvoice(invoice._id.toString());
  }

  async recordPayment(
    userId: string,
    invoiceId: string,
    data: RecordInvoicePaymentDTO,
  ) {
    const invoice = await this.getOwnedInvoice(userId, invoiceId);

    if (invoice.cancelledAt) {
      throw new ValidationError("Cancelled invoices cannot receive payments");
    }

    const amount = roundMoney(Number(data.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ValidationError("Payment amount must be greater than zero");
    }
    if (amount > invoice.balanceDue) {
      throw new ValidationError("Payment amount cannot exceed the invoice balance");
    }

    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();
    if (Number.isNaN(paymentDate.getTime())) {
      throw new ValidationError("Invalid payment date");
    }

    const customer = await this.getOwnedCustomer(userId, invoice.customer.toString());
    const method = data.method?.trim();
    if (!method) {
      throw new ValidationError("Payment method is required");
    }

    const payment = new InvoicePayment({
      user: userId,
      invoice: invoice._id,
      customer: customer._id,
      amount,
      paymentDate,
      method,
      reference: data.reference?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      recordedBy: userId,
    });

    const income = new Income({
      user: userId,
      customer: customer._id,
      invoice: invoice._id,
      title: `Invoice payment ${invoice.invoiceNumber}`,
      amount,
      category: "invoice payment",
      date: paymentDate,
      description: `Payment recorded for ${invoice.invoiceNumber}`,
    });

    await income.save();
    payment.income = income._id as mongoose.Types.ObjectId;
    await payment.save();

    invoice.amountPaid = roundMoney(invoice.amountPaid + amount);
    invoice.balanceDue = roundMoney(invoice.total - invoice.amountPaid);
    if (!invoice.sentAt) {
      invoice.sentAt = paymentDate;
    }
    if (invoice.balanceDue <= 0) {
      invoice.paidAt = paymentDate;
    }
    invoice.status = this.deriveStatus(invoice as any);
    await invoice.save();

    if (!customer.lastPaidDate || paymentDate > customer.lastPaidDate) {
      customer.lastPaidDate = paymentDate;
      await customer.save();
    }

    await this.monthlySummaryService.calculate(
      userId,
      paymentDate.getMonth() + 1,
      paymentDate.getFullYear(),
    );

    return {
      invoice: await this.hydrateInvoice(invoice._id.toString()),
      payment,
    };
  }

  async cancel(userId: string, invoiceId: string) {
    const invoice = await this.getOwnedInvoice(userId, invoiceId);

    if (invoice.amountPaid > 0) {
      throw new ValidationError("Invoices with payments cannot be cancelled");
    }

    invoice.cancelledAt = new Date();
    invoice.status = "cancelled";
    invoice.balanceDue = invoice.total;
    await invoice.save();

    return this.hydrateInvoice(invoice._id.toString());
  }

  async getSummary(userId: string) {
    const invoices = (await Invoice.find({ user: userId })
      .populate("customer", "name brandName")
      .lean()) as any[];

    const normalized = invoices.map((invoice) => ({
      ...invoice,
      status: this.deriveStatus(invoice),
    }));

    const openInvoices = normalized.filter((invoice) =>
      ["sent", "partially_paid", "overdue"].includes(invoice.status),
    );
    const overdueInvoices = openInvoices.filter(
      (invoice) => invoice.status === "overdue",
    );
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const payments = await InvoicePayment.find({
      user: userId,
      paymentDate: { $gte: monthStart },
    }).lean();

    const topOverdueCustomers = overdueInvoices
      .reduce((map: Record<string, number>, invoice: any) => {
        const customerName = invoice.customer?.brandName
          ? `${invoice.customer.name} (${invoice.customer.brandName})`
          : invoice.customer?.name || "Unknown";
        map[customerName] = roundMoney(
          (map[customerName] || 0) + invoice.balanceDue,
        );
        return map;
      }, {})
    ;

    return {
      totalReceivables: roundMoney(
        openInvoices.reduce((sum, invoice) => sum + invoice.balanceDue, 0),
      ),
      overdueReceivables: roundMoney(
        overdueInvoices.reduce((sum, invoice) => sum + invoice.balanceDue, 0),
      ),
      collectedThisMonth: roundMoney(
        payments.reduce((sum, payment) => sum + payment.amount, 0),
      ),
      openInvoiceCount: openInvoices.length,
      overdueInvoiceCount: overdueInvoices.length,
      topOverdueCustomers: Object.entries(topOverdueCustomers)
        .map(([customerName, balanceDue]) => ({ customerName, balanceDue }))
        .sort((a, b) => Number(b.balanceDue) - Number(a.balanceDue))
        .slice(0, 5),
    };
  }

  async getAgingReport(userId: string) {
    const invoices = (await Invoice.find({ user: userId })
      .populate("customer", "name brandName")
      .lean()) as any[];

    const today = startOfDay(new Date());
    const buckets = {
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61plus: 0,
    };

    const items = invoices
      .map((invoice) => ({
        ...invoice,
        status: this.deriveStatus(invoice),
      }))
      .filter((invoice) =>
        ["sent", "partially_paid", "overdue"].includes(invoice.status),
      )
      .map((invoice) => {
        const dueDate = startOfDay(new Date(invoice.dueDate));
        const diffDays = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffDays <= 0) {
          buckets.current = roundMoney(buckets.current + invoice.balanceDue);
        } else if (diffDays <= 30) {
          buckets.days1to30 = roundMoney(
            buckets.days1to30 + invoice.balanceDue,
          );
        } else if (diffDays <= 60) {
          buckets.days31to60 = roundMoney(
            buckets.days31to60 + invoice.balanceDue,
          );
        } else {
          buckets.days61plus = roundMoney(
            buckets.days61plus + invoice.balanceDue,
          );
        }

        return {
          _id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          dueDate: invoice.dueDate,
          total: invoice.total,
          amountPaid: invoice.amountPaid,
          balanceDue: invoice.balanceDue,
          customerName: invoice.customer?.brandName
            ? `${invoice.customer.name} (${invoice.customer.brandName})`
            : invoice.customer?.name || "Unknown",
          daysPastDue: Math.max(diffDays, 0),
        };
      })
      .sort((a, b) => b.daysPastDue - a.daysPastDue);

    return { buckets, items };
  }

  async getPayments(
    userId: string,
    invoiceId: string,
  ): Promise<IInvoicePayment[]> {
    const invoice = await this.getOwnedInvoice(userId, invoiceId);
    return (await InvoicePayment.find({
      user: userId,
      invoice: invoice._id,
    })
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean()) as unknown as IInvoicePayment[];
  }
}
