export interface InvoiceLineItemDTO {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceDTO {
  customerId: string;
  issueDate: Date;
  dueDate: Date;
  currency?: string;
  lineItems: InvoiceLineItemDTO[];
  tax?: number;
  discount?: number;
  notes?: string;
}

export interface UpdateInvoiceDTO {
  issueDate?: Date;
  dueDate?: Date;
  currency?: string;
  lineItems?: InvoiceLineItemDTO[];
  tax?: number;
  discount?: number;
  notes?: string;
}

export interface RecordInvoicePaymentDTO {
  amount: number;
  paymentDate?: Date;
  method: string;
  reference?: string;
  notes?: string;
}

export interface InvoiceQueryDTO {
  page?: string;
  limit?: string;
  customerId?: string;
  status?: string;
  month?: string;
  year?: string;
  search?: string;
}
