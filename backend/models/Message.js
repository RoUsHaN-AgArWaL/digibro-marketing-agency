import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);