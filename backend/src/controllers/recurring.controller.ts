import { Request, Response, NextFunction } from "express";
import { RecurringService } from "../services/recurring.service";

export class RecurringController {
  private recurringService = new RecurringService();

  getAll = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const items = await this.recurringService.getAll(req.userId!);
      res.json(items);
    } catch (error) {
      next(error);
    }
  };

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const item = await this.recurringService.create(req.userId!, req.body);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const item = await this.recurringService.update(
        req.userId!,
        req.params.id as string,
        req.body,
      );
      res.json(item);
    } catch (error) {
      next(error);
    }
  };

  toggleActive = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const item = await this.recurringService.toggleActive(
        req.userId!,
        req.params.id as string,
      );
      res.json(item);
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.recurringService.delete(req.userId!, req.params.id as string);
      res.json({ message: "Recurring transaction deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}
