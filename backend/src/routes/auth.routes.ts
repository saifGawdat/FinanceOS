import { Router } from "express";
import { body } from "express-validator";
import { AuthController } from "../controllers/auth.controller";
import { auth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";

const router = Router();
const authController = new AuthController();

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    validate,
  ],
  authController.register,
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
    validate,
  ],
  authController.login,
);

router.post("/google", authController.googleLogin);

router.delete("/delete-account", auth, authController.deleteAccount);

router.get("/me", auth, authController.getMe);

router.patch("/profile", auth, authController.updateProfile);

export default router;
