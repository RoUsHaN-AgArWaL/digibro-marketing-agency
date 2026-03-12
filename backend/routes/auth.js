import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { Admin } from "../models/Admin.js";

const router = express.Router();

const demoAdminEmail = "admin@digibro.agency";
let demoAdminPasswordHash;

(async () => {
  demoAdminPasswordHash = await bcrypt.hash("digibro123", 12);
})();

router.post(
  "/login",
  [body("email").isEmail(), body("password").isLength({ min: 6 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const admin = await Admin.findOne({ email: req.body.email.toLowerCase() });
        if (admin) {
          const validPassword = await bcrypt.compare(req.body.password, admin.passwordHash);
          if (validPassword) {
            const token = jwt.sign({ id: admin._id, role: admin.role, email: admin.email }, process.env.JWT_SECRET || "digibro_demo_secret", {
              expiresIn: "7d",
            });
            return res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email } });
          }
        }
      } catch { }

      if (req.body.email.toLowerCase() === demoAdminEmail) {
        const validPassword = await bcrypt.compare(req.body.password, demoAdminPasswordHash);
        if (validPassword) {
          const token = jwt.sign({ id: "demo-admin", role: "admin", email: demoAdminEmail }, process.env.JWT_SECRET || "digibro_demo_secret", {
            expiresIn: "7d",
          });
          return res.json({ token, admin: { id: "demo-admin", name: "DIGIBRO Admin", email: demoAdminEmail } });
        }
      }

      return res.status(401).json({ message: "Invalid credentials." });
    } catch (error) {
      next(error);
    }
  },
);

export default router;