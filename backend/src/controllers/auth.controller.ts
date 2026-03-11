import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  private authService = new AuthService();

  register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  googleLogin = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.authService.googleLogin(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getMe = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await this.authService.getMe(req.userId!);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await this.authService.updateProfile(req.userId!, req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  deleteAccount = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.authService.deleteAccount(req.userId!);
      res.json({ message: "Account successfully deleted", success: true });
    } catch (error) {
      next(error);
    }
  };
}
