import { NextFunction, Request, Response } from "express";
import { InvoiceService } from "../services/invoice.service";

export class InvoiceController {
  private invoiceService = new InvoiceService();

  createInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await this.invoiceService.create(req.userId!, req.body);
      res.status(201).json(invoice);
    } catch (error) {
      next(error);
    }
  };

  getInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, customerId, status, month, year, search } = req.query;
      const result = await this.invoiceService.getAll(req.userId!, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        customerId: customerId as string | undefined,
        status: status as string | undefined,
        month: month ? parseInt(month as string, 10) : undefined,
        year: year ? parseInt(year as string, 10) : undefined,
        search: search as string | undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.invoiceService.getById(
        req.userId!,
        req.params.id as string,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await this.invoiceService.update(
        req.userId!,
        req.params.id as string,
        req.body,
      );
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  };

  sendInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await this.invoiceService.markAsSent(
        req.userId!,
        req.params.id as string,
      );
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  };

  recordPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.invoiceService.recordPayment(
        req.userId!,
        req.params.id as string,
        req.body,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  getPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payments = await this.invoiceService.getPayments(
        req.userId!,
        req.params.id as string,
      );
      res.json(payments);
    } catch (error) {
      next(error);
    }
  };

  cancelInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await this.invoiceService.cancel(
        req.userId!,
        req.params.id as string,
      );
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  };

  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await this.invoiceService.getSummary(req.userId!);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  };

  getAging = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const aging = await this.invoiceService.getAgingReport(req.userId!);
      res.json(aging);
    } catch (error) {
      next(error);
    }
  };
}
