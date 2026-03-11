import mongoose from "mongoose";

const portfolioProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    category: { type: String, trim: true },
    client: { type: String, trim: true },
    summary: String,
    images: [String],
    metrics: [String],
    testimonial: String,
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const PortfolioProject = mongoose.models.PortfolioProject || mongoose.model("PortfolioProject", portfolioProjectSchema);