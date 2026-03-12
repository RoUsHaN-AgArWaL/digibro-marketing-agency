import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { Admin } from "../models/Admin.js";

const router = express.Router();

const demoAdminEmail = "admin@digibro.agency";

/* Pre-generated bcrypt hash for password: digibro123 */
const demoAdminPasswordHash =
  "$2a$12$9F7zYF9c7d9GvG3F9HcY4O0cMZQv1ZLkXxJ2C6F9O6i6nXbV2s5dK";

router.post(
  "/login",
  [body("email").isEmail(), body("password").isLength({ min: 6 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const email = req.body.email.toLowerCase();
      const password = req.body.password;

      /* Try MongoDB Admin */
      try {
        const admin = await Admin.findOne({ email });

        if (admin) {
          const validPassword = await bcrypt.compare(
            password,
            admin.passwordHash
          );

          if (validPassword) {
            const token = jwt.sign(
              {
                id: admin._id,
                role: admin.role,
                email: admin.email,
              },
              process.env.JWT_SECRET || "digibro_demo_secret",
              { expiresIn: "7d" }
            );

            return res.json({
              token,
              admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
              },
            });
          }
        }
      } catch {}

      /* Demo Admin Login */
      if (email === demoAdminEmail) {
        const validPassword = await bcrypt.compare(
          password,
          demoAdminPasswordHash
        );

        if (validPassword) {
          const token = jwt.sign(
            {
              id: "demo-admin",
              role: "admin",
              email: demoAdminEmail,
            },
            process.env.JWT_SECRET || "digibro_demo_secret",
            { expiresIn: "7d" }
          );

          return res.json({
            token,
            admin: {
              id: "demo-admin",
              name: "DIGIBRO Admin",
              email: demoAdminEmail,
            },
          });
        }
      }

      return res.status(401).json({ message: "Invalid credentials." });

    } catch (error) {
      next(error);
    }
  }
);

export default router;