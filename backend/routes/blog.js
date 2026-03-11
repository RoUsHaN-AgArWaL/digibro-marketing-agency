// import express from "express";
// import { BlogPost } from "../models/BlogPost.js";
// import { requireAdmin, verifyToken } from "../middleware/auth.js";

// const router = express.Router();

// router.get("/", async (req, res, next) => {
//   try {
//     const posts = await BlogPost.find({ published: true }).sort({ createdAt: -1 });
//     res.json(posts);
//   } catch (error) {
//     next(error);
//   }
// });

// router.get("/:slug", async (req, res, next) => {
//   try {
//     const post = await BlogPost.findOne({ slug: req.params.slug });
//     if (!post) return res.status(404).json({ message: "Blog post not found." });
//     res.json(post);
//   } catch (error) {
//     next(error);
//   }
// });

// router.post("/", verifyToken, requireAdmin, async (req, res, next) => {
//   try {
//     const post = await BlogPost.create(req.body);
//     res.status(201).json(post);
//   } catch (error) {
//     next(error);
//   }
// });

// router.put("/:id", verifyToken, requireAdmin, async (req, res, next) => {
//   try {
//     const post = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     res.json(post);
//   } catch (error) {
//     next(error);
//   }
// });

// router.delete("/:id", verifyToken, requireAdmin, async (req, res, next) => {
//   try {
//     await BlogPost.findByIdAndDelete(req.params.id);
//     res.json({ success: true });
//   } catch (error) {
//     next(error);
//   }
// });

// export default router;



import express from "express";
import { BlogPost } from "../models/BlogPost.js";
import { requireAdmin, verifyToken } from "../middleware/auth.js";

const router = express.Router();

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildBlogPayload(body) {
  return {
    ...body,
    slug: body.slug || slugify(body.title || "post"),
    content: Array.isArray(body.content) && body.content.length ? body.content : [body.excerpt || ""],
    readTime: body.readTime || "3 min read",
    author: body.author || "DIGIBRO Team",
  };
}

function blogQuery(idOrSlug) {
  return /^[a-f\d]{24}$/i.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
}

router.get("/", async (req, res, next) => {
  try {
    const posts = await BlogPost.find({ published: true }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug });
    if (!post) return res.status(404).json({ message: "Blog post not found." });
    res.json(post);
  } catch (error) {
    next(error);
  }
});

router.post("/", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const post = await BlogPost.create(buildBlogPayload(req.body));
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const post = await BlogPost.findOneAndUpdate(blogQuery(req.params.id), buildBlogPayload(req.body), {
      new: true,
      runValidators: true,
    });
    if (!post) return res.status(404).json({ message: "Blog post not found." });
    res.json(post);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const post = await BlogPost.findOneAndDelete(blogQuery(req.params.id));
    if (!post) return res.status(404).json({ message: "Blog post not found." });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;