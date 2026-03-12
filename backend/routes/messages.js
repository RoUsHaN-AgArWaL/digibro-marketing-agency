import express from "express";
import sanitizeHtml from "sanitize-html";
import { body, validationResult } from "express-validator";
import { Message } from "../models/Message.js";
import { requireAdmin, verifyToken } from "../middleware/auth.js";
import { sendAdminNotification } from "../utils/sendEmail.js";

const router = express.Router();

/* fallback memory store (only if DB fails) */
let localMessages = [];

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

      try {
        const message = await Message.create(payload);

        await sendAdminNotification(
          "New DIGIBRO contact message",
          `${message.name} sent a new inquiry.`
        );

        return res.status(201).json(message);
      } catch (dbError) {
        console.error("MongoDB message write failed:", dbError);

        const fallback = {
          _id: Math.random().toString(36).slice(2) + Date.now().toString(36),
          ...payload,
          createdAt: new Date().toISOString(),
        };

        localMessages.unshift(fallback);

        await sendAdminNotification(
          "New DIGIBRO contact message (fallback)",
          `${fallback.name} sent a new inquiry.`
        );

        return res.status(201).json(fallback);
      }
    } catch (error) {
      next(error);
    }
  }
);

router.get("/", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    try {
      const messages = await Message.find().sort({ createdAt: -1 }).lean();
      return res.json(messages);
    } catch (dbError) {
      console.error("MongoDB message read failed:", dbError);
      return res.json(localMessages);
    }
  } catch (error) {
    next(error);
  }
});

export default router;