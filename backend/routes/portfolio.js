import express from "express";
import { PortfolioProject } from "../models/PortfolioProject.js";
import { requireAdmin, verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const projects = await PortfolioProject.find({ published: true }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const project = await PortfolioProject.findOne({ slug: req.params.slug });
    if (!project) return res.status(404).json({ message: "Project not found." });
    res.json(project);
  } catch (error) {
    next(error);
  }
});

router.post("/", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const project = await PortfolioProject.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const project = await PortfolioProject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(project);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    await PortfolioProject.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;