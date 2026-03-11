import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  service: { type: String, required: true, trim: true },

  message: { type: String, trim: true },

  preferredDate: { type: String },
  preferredTime: { type: String },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  }
},
{ timestamps: true }
);

export const Appointment =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);