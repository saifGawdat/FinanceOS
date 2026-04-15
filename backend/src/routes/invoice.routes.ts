import { Router } from "express";
import { InvoiceController } from "../controllers/invoice.controller";
import { auth } from "../middleware/auth.middleware";

const router = Router();
const invoiceController = new InvoiceController();

router.get("/reports/summary", auth, invoiceController.getSummary);
router.get("/reports/aging", auth, invoiceController.getAging);
router.post("/", auth, invoiceController.createInvoice);
router.get("/", auth, invoiceController.getInvoices);
router.get("/:id", auth, invoiceController.getInvoice);
router.put("/:id", auth, invoiceController.updateInvoice);
router.post("/:id/send", auth, invoiceController.sendInvoice);
router.post("/:id/payments", auth, invoiceController.recordPayment);
router.get("/:id/payments", auth, invoiceController.getPayments);
router.post("/:id/cancel", auth, invoiceController.cancelInvoice);

export default router;
