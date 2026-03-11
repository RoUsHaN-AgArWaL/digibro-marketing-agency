import express from "express";
import sanitizeHtml from "sanitize-html";
import { body, validationResult } from "express-validator";
import { isDatabaseConnected } from "../config/db.js";
import { Appointment } from "../models/Appointment.js";
import { requireAdmin, verifyToken } from "../middleware/auth.js";
import { sendAdminNotification } from "../utils/sendEmail.js";

const router = express.Router();

let localAppointments = [];

router.post(
  "/",
  [body("name").notEmpty(), body("email").isEmail(), body("phone").notEmpty(), body("service").notEmpty()],
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
        phone: req.body.phone,
        service: req.body.service,
        message: sanitizeHtml(String(req.body.message || "")),
        preferredDate: req.body.preferredDate || "",
        preferredTime: req.body.preferredTime || "",
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      if (isDatabaseConnected()) {
        const appointment = await Appointment.create({
          ...req.body,
          message: sanitizeHtml(req.body.message || ""),
        });
        await sendAdminNotification("New DIGIBRO appointment", `${appointment.name} booked ${appointment.service}.`);
        return res.status(201).json(appointment);
      }

      localAppointments.unshift(payload);
      await sendAdminNotification("New DIGIBRO appointment (demo)", `${payload.name} booked ${payload.service}.`);
      return res.status(201).json(payload);
    } catch (error) {
      next(error);
    }
  },
);

router.get("/", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    if (isDatabaseConnected()) {
      const appointments = await Appointment.find().sort({ createdAt: -1 });
      return res.json(appointments);
    }

    return res.json(localAppointments);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    if (isDatabaseConnected()) {
      const appointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true, runValidators: true },
      );

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found." });
      }

      return res.json(appointment);
    }

    const idx = localAppointments.findIndex((a) => a._id === req.params.id);
    if (idx >= 0) {
      localAppointments[idx].status = req.body.status;
      return res.json(localAppointments[idx]);
    }
    return res.status(404).json({ message: "Not found" });
  } catch (error) {
    next(error);
  }
});

export default router;