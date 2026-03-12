import express from "express";
import sanitizeHtml from "sanitize-html";
import { body, validationResult } from "express-validator";
import { Message } from "../models/Message.js";
import { requireAdmin, verifyToken } from "../middleware/auth.js";
import { sendAdminNotification } from "../utils/sendEmail.js";

const router = express.Router();

router.post(
  "/",
  [body("name").notEmpty(), body("email").isEmail(), body("message").notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const payload = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone || "",
        company: req.body.company || "",
        message: sanitizeHtml(String(req.body.message)),
      };

      const message = await Message.create(payload);

      await sendAdminNotification(
        "New DIGIBRO contact message",
        `${message.name} sent a new inquiry.`
      );

      return res.status(201).json(message);
    } catch (error) {
      console.error("MongoDB message write failed:", error);
      next(error);
    }
  }
);

router.get("/", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).lean();
    return res.json(messages);
  } catch (error) {
    console.error("MongoDB message read failed:", error);
    next(error);
  }
});

export default router;