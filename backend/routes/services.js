// import express from "express";
// import { Service } from "../models/Service.js";
// import { requireAdmin, verifyToken } from "../middleware/auth.js";

// const router = express.Router();

// router.get("/", async (req, res, next) => {
//   try {
//     const services = await Service.find().sort({ createdAt: -1 });
//     res.json(services);
//   } catch (error) {
//     next(error);
//   }
// });

// router.get("/:slug", async (req, res, next) => {
//   try {
//     const service = await Service.findOne({ slug: req.params.slug });
//     if (!service) return res.status(404).json({ message: "Service not found." });
//     res.json(service);
//   } catch (error) {
//     next(error);
//   }
// });

// router.post("/", verifyToken, requireAdmin, async (req, res, next) => {
//   try {
//     const service = await Service.create(req.body);
//     res.status(201).json(service);
//   } catch (error) {
//     next(error);
//   }
// });

// router.put("/:id", verifyToken, requireAdmin, async (req, res, next) => {
//   try {
//     const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     res.json(service);
//   } catch (error) {
//     next(error);
//   }
// });

// router.delete("/:id", verifyToken, requireAdmin, async (req, res, next) => {
//   try {
//     await Service.findByIdAndDelete(req.params.id);
//     res.json({ success: true });
//   } catch (error) {
//     next(error);
//   }
// });

// export default router;


import express from "express";
import { Service } from "../models/Service.js";
import { requireAdmin, verifyToken } from "../middleware/auth.js";

const router = express.Router();

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildServicePayload(body) {
  return {
    ...body,
    slug: body.slug || slugify(body.name || "service"),
    process: Array.isArray(body.process) && body.process.length ? body.process : ["Discover", "Design", "Build", "Launch"],
    packages: Array.isArray(body.packages) && body.packages.length
      ? body.packages
      : [{ name: "Custom", price: "Custom", features: ["Scope on request"] }],
    results: Array.isArray(body.results) && body.results.length ? body.results : ["Tailored delivery"],
  };
}

function serviceQuery(idOrSlug) {
  return /^[a-f\d]{24}$/i.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
}

router.get("/", async (req, res, next) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    next(error);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const service = await Service.findOne({ slug: req.params.slug });
    if (!service) return res.status(404).json({ message: "Service not found." });
    res.json(service);
  } catch (error) {
    next(error);
  }
});

router.post("/", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const service = await Service.create(buildServicePayload(req.body));
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const service = await Service.findOneAndUpdate(serviceQuery(req.params.id), buildServicePayload(req.body), {
      new: true,
      runValidators: true,
    });
    if (!service) return res.status(404).json({ message: "Service not found." });
    res.json(service);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const service = await Service.findOneAndDelete(serviceQuery(req.params.id));
    if (!service) return res.status(404).json({ message: "Service not found." });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;