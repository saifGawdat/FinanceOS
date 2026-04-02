import { Request, Response, NextFunction } from "express";
import { GoalsService } from "../services/goals.service";

export class GoalsController { 
    private goalsService = new GoalsService();
    createGoal = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const goal = await this.goalsService.create(req.userId!, req.body);
            res.status(201).json(goal);
        } catch (error) {
            next(error);
        }
    }
    getGoals = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const goals = await this.goalsService.getAll(req.userId!);
            res.json(goals);
        } catch (error) {
            next(error);
        }
    }
    getGoalById = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const goal = await this.goalsService.getById(req.userId!, req.params.id as string);
            res.json(goal);
        } catch (error) {
            next(error);
        }
    }
    updateGoal = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const goal = await this.goalsService.update(req.userId!, req.params.id as string, req.body);
            res.json(goal);
        } catch (error) {
            next(error);
        }
    }
    deleteGoal = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            await this.goalsService.delete(req.userId!, req.params.id as string);
            res.json({ message: "Goal deleted successfully" });
        } catch (error) {
            next(error);
        }
    }
}