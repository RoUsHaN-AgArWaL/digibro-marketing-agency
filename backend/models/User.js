import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String },
    role: { type: String, default: "client" },
    company: { type: String, trim: true },
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);