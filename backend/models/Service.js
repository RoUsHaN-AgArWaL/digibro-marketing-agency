import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    name: String,
    price: String,
    features: [String],
  },
  { _id: false },
);

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    category: { type: String, trim: true },
    shortDescription: String,
    description: String,
    process: [String],
    packages: [packageSchema],
    results: [String],
    featuredImage: String,
    featured: { type: Boolean, default: false },
    seo: {
      title: String,
      description: String,
    },
  },
  { timestamps: true },
);

export const Service = mongoose.models.Service || mongoose.model("Service", serviceSchema);