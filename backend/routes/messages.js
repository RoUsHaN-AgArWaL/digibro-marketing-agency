import express from "express";
import sanitizeHtml from "sanitize-html";
import { body, validationResult } from "express-validator";
import { isDatabaseConnected } from "../config/db.js";
import { Message } from "../models/Message.js";
import { requireAdmin, verifyToken } from "../middleware/auth.js";
import { sendAdminNotification } from "../utils/sendEmail.js";

const router = express.Router();
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
        _id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone || "",
        company: req.body.company || "",
        message: sanitizeHtml(String(req.body.message)),
        createdAt: new Date().toISOString(),
      };

      if (isDatabaseConnected()) {
        const message = await Message.create({
          ...req.body,
          message: sanitizeHtml(req.body.message),
        });
        await sendAdminNotification("New DIGIBRO contact message", `${message.name} sent a new inquiry.`);
        return res.status(201).json(message);
      }

      localMessages.unshift(payload);
      await sendAdminNotification("New DIGIBRO contact message (demo)", `${payload.name} sent a new inquiry.`);
      return res.status(201).json(payload);
    } catch (error) {
      next(error);
    }
  },
);

router.get("/", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    if (isDatabaseConnected()) {
      const messages = await Message.find().sort({ createdAt: -1 });
      return res.json(messages);
    }

    return res.json(localMessages);
  } catch (error) {
    next(error);
  }
});

export default router;