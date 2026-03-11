import express from "express";
import { Appointment } from "../models/Appointment.js";
import { BlogPost } from "../models/BlogPost.js";
import { Message } from "../models/Message.js";
import { PortfolioProject } from "../models/PortfolioProject.js";
import { Service } from "../models/Service.js";
import { User } from "../models/User.js";
import { requireAdmin, verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/stats", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const [totalClients, totalAppointments, totalServices, totalMessages, totalPosts, totalProjects] = await Promise.all([
      User.countDocuments(),
      Appointment.countDocuments(),
      Service.countDocuments(),
      Message.countDocuments(),
      BlogPost.countDocuments(),
      PortfolioProject.countDocuments(),
    ]);

    res.json({
      totalClients,
      totalAppointments,
      totalServices,
      totalMessages,
      totalPosts,
      totalProjects,
    });
  } catch (error) {
    next(error);
  }
});

export default router;