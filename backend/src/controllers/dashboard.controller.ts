import { Request, Response, NextFunction } from "express";
import { DashboardService } from "../services/dashboard.service";

export class DashboardController {
  private dashboardService = new DashboardService();

  getStats = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { month, year } = req.query;
      const stats = await this.dashboardService.getStats(
        req.userId!,
        month ? parseInt(month as string) : undefined,
        year ? parseInt(year as string) : undefined,
      );
      res.json(stats);
    } catch (error) {
      next(error);
    }
  };

  getChartData = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { month, year } = req.query;
      const chartData = await this.dashboardService.getChartData(
        req.userId!,
        month ? parseInt(month as string) : undefined,
        year ? parseInt(year as string) : undefined,
      );
      res.json(chartData);
    } catch (error) {
      next(error);
    }
  };

  getRecentTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { month, year } = req.query;
      const transactions = await this.dashboardService.getRecentTransactions(
        req.userId!,
        month ? parseInt(month as string) : undefined,
        year ? parseInt(year as string) : undefined,
      );
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  };

  getReceivables = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const receivables = await this.dashboardService.getReceivables(req.userId!);
      res.json(receivables);
    } catch (error) {
      next(error);
    }
  };
}
