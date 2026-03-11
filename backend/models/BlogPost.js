import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    category: { type: String, trim: true },
    excerpt: String,
    coverImage: String,
    content: [String],
    published: { type: Boolean, default: true },
    readTime: String,
    author: { type: String, default: "DIGIBRO Team" },
  },
  { timestamps: true },
);

export const BlogPost = mongoose.models.BlogPost || mongoose.model("BlogPost", blogPostSchema);