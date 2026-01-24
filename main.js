// ============================================
// BACKEND - main.js (cho CodeSandbox)
// ============================================
// Copy cái này vào file main.js của Node.js CodeSandbox

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;
const SECRET_KEY = process.env.SECRET_KEY || "frc-qn-secret-key-2025";

// ============ CORS - Allow ALL ============
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(
  cors({
    origin: "*",
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

console.log("🚀 CORS enabled for all origins");

// ============ Health Check ============
app.get("/health", (req, res) => {
  res.json({ status: "OK", uptime: process.uptime() });
});

// ============ Multer ============
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Invalid file type"));
  },
});

// ============ Database ============
const DATA_DIR = "./data";
const POSTS_FILE = `${DATA_DIR}/posts.json`;
const COMMENTS_FILE = `${DATA_DIR}/comments.json`;

let posts = [];
let comments = [];

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const loadData = () => {
  try {
    if (fs.existsSync(POSTS_FILE)) {
      posts = JSON.parse(fs.readFileSync(POSTS_FILE, "utf8"));
      console.log(`📚 Loaded ${posts.length} posts`);
    }
    if (fs.existsSync(COMMENTS_FILE)) {
      comments = JSON.parse(fs.readFileSync(COMMENTS_FILE, "utf8"));
      console.log(`💬 Loaded ${comments.length} comments`);
    }
  } catch (error) {
    console.error("Error loading data:", error);
    posts = [];
    comments = [];
  }
};

const saveData = () => {
  try {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
    console.log("💾 Data saved");
  } catch (error) {
    console.error("Error saving data:", error);
  }
};

loadData();

// ============ Admin ============
const ADMIN = {
  username: "frcqn",
  passwordHash: bcrypt.hashSync("00000000", 10),
};

// ============ Auth Middleware ============
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "No token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};

const bufferToBase64 = (buffer) => buffer.toString("base64");

// ============ AUTH Routes ============
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt:", username);

    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Missing credentials" });
    }

    if (
      username === ADMIN.username &&
      (await bcrypt.compare(password, ADMIN.passwordHash))
    ) {
      const token = jwt.sign({ username, role: "admin" }, SECRET_KEY, {
        expiresIn: "24h",
      });
      return res.json({
        success: true,
        token,
        user: { username, role: "admin" },
      });
    }

    return res
      .status(401)
      .json({ success: false, error: "Invalid credentials" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/auth/verify", authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ============ POSTS Routes ============
app.get("/api/posts", (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    let filteredPosts = [...posts];

    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower)
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    const postsPreview = paginatedPosts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author,
      createdAt: post.createdAt,
      files: post.files.map((f) => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
      })),
      commentCount: comments.filter((c) => c.postId === post.id).length,
    }));

    res.json({
      success: true,
      data: postsPreview,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredPosts.length / limit),
        totalItems: filteredPosts.length,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/posts/:id", (req, res) => {
  try {
    const post = posts.find((p) => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }
    const postComments = comments.filter((c) => c.postId === req.params.id);
    res.json({ success: true, data: { ...post, comments: postComments } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post(
  "/api/posts",
  authenticate,
  upload.array("files", 10),
  async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res
          .status(400)
          .json({ success: false, error: "Title and content required" });
      }

      const files = req.files || [];
      const base64Files = files.map((file) => ({
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        base64: bufferToBase64(file.buffer),
      }));

      const post = {
        id: Date.now().toString(),
        title,
        content,
        files: base64Files,
        createdAt: new Date().toISOString(),
        author: req.user.username,
      };

      posts.unshift(post);
      saveData();
      console.log(`✅ Created post: "${title}"`);

      res.status(201).json({
        success: true,
        data: {
          ...post,
          files: post.files.map((f) => ({
            originalname: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
          })),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

app.delete("/api/posts/:id", authenticate, (req, res) => {
  try {
    const index = posts.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }
    const post = posts[index];
    posts.splice(index, 1);
    comments = comments.filter((c) => c.postId !== req.params.id);
    saveData();
    console.log(`🗑️ Deleted post: "${post.title}"`);
    res.json({ success: true, message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/posts/:postId/files/:fileIndex", (req, res) => {
  try {
    const post = posts.find((p) => p.id === req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }
    const fileIndex = parseInt(req.params.fileIndex);
    const file = post.files[fileIndex];
    if (!file) {
      return res.status(404).json({ success: false, error: "File not found" });
    }
    const dataUrl = `data:${file.mimetype};base64,${file.base64}`;
    res.json({
      success: true,
      data: {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        dataUrl: dataUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ COMMENTS Routes ============
app.get("/api/posts/:postId/comments", (req, res) => {
  try {
    const postComments = comments.filter((c) => c.postId === req.params.postId);
    res.json({ success: true, data: postComments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/posts/:id/comments", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const postId = req.params.id;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, error: "All fields required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: "Invalid email" });
    }

    const post = posts.find((p) => p.id === postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    const comment = {
      id: Date.now().toString(),
      postId,
      name,
      email,
      message,
      createdAt: new Date().toISOString(),
    };

    comments.push(comment);
    saveData();
    console.log(`✅ Comment added by ${name} on "${post.title}"`);

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/comments/:id", authenticate, (req, res) => {
  try {
    const index = comments.findIndex((c) => c.id === req.params.id);
    if (index === -1) {
      return res
        .status(404)
        .json({ success: false, error: "Comment not found" });
    }
    comments.splice(index, 1);
    saveData();
    res.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Error Handler ============
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res
    .status(500)
    .json({ success: false, error: err.message || "Internal server error" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ============ Start Server ============
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🤖 FRC QUY NHƠN API SERVER            ║
╠════════════════════════════════════════╣
║  🌐 Server: http://localhost:${PORT}      ║
║  🔐 Auth: JWT Token                    ║
║  💾 Storage: JSON Files                ║
║  🔄 CORS: ALL ORIGINS ALLOWED          ║
╚════════════════════════════════════════╝
  `);
});

