// ========================================
// FRC QUY NHƠN - API SERVER
// Ready to deploy on Railway/Render
// ========================================

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'frc-qn-secret-key-2025';

console.log('🚀 Starting FRC Backend Server...');
console.log('📌 PORT:', PORT);
console.log('🔐 Environment:', process.env.NODE_ENV || 'development');

// ============ CORS Configuration ============
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(cors({
  origin: '*',
  credentials: false
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

console.log('✅ CORS enabled for all origins');

// ============ Health Check ============
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// ============ Multer Configuration ============
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|mp4|webm/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: jpg, png, gif, pdf, doc, docx, txt, zip, mp4, webm'));
    }
  }
});

// ============ Database Configuration ============
const DATA_DIR = path.join(__dirname, 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');

let posts = [];
let comments = [];

// Create data directory if not exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('📁 Created data directory');
}

// Load data from files
const loadData = () => {
  try {
    if (fs.existsSync(POSTS_FILE)) {
      posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
      console.log(`📚 Loaded ${posts.length} posts`);
    } else {
      posts = [];
      console.log('📚 No posts file found, starting fresh');
    }
    
    if (fs.existsSync(COMMENTS_FILE)) {
      comments = JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf8'));
      console.log(`💬 Loaded ${comments.length} comments`);
    } else {
      comments = [];
      console.log('💬 No comments file found, starting fresh');
    }
  } catch (error) {
    console.error('❌ Error loading data:', error.message);
    posts = [];
    comments = [];
  }
};

// Save data to files
const saveData = () => {
  try {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
    console.log('💾 Data saved successfully');
  } catch (error) {
    console.error('❌ Error saving data:', error.message);
    throw error;
  }
};

loadData();

// ============ Admin Configuration ============
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'frcqn';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync('00000000', 10);

console.log(`🔐 Admin username: ${ADMIN_USERNAME}`);

// ============ Authentication Middleware ============
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      error: 'No token provided' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
};

// ============ Helper Functions ============
const bufferToBase64 = (buffer) => {
  return buffer.toString('base64');
};

const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

// ============ AUTH Routes ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`🔐 Login attempt: ${username}`);
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Username and password are required' 
      });
    }
    
    if (username === ADMIN_USERNAME && await bcrypt.compare(password, ADMIN_PASSWORD_HASH)) {
      const token = jwt.sign(
        { username, role: 'admin' }, 
        SECRET_KEY, 
        { expiresIn: '24h' }
      );
      
      console.log(`✅ Login successful: ${username}`);
      
      return res.json({ 
        success: true, 
        token,
        user: { username, role: 'admin' }
      });
    } else {
      console.log(`❌ Login failed: ${username}`);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/auth/verify', authenticate, (req, res) => {
  res.json({ 
    success: true, 
    user: req.user 
  });
});

// ============ POSTS Routes ============

// Get all posts with pagination and search
app.get('/api/posts', (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    let filteredPosts = [...posts];
    
    // Search functionality
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower)
      );
    }
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
    
    // Remove base64 from response for performance
    const postsPreview = paginatedPosts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content.substring(0, 500),
      author: post.author,
      createdAt: post.createdAt,
      files: post.files.map(f => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size
      })),
      commentCount: comments.filter(c => c.postId === post.id).length
    }));
    
    res.json({
      success: true,
      data: postsPreview,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(filteredPosts.length / limitNum),
        totalItems: filteredPosts.length,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single post with full details
app.get('/api/posts/:id', (req, res) => {
  try {
    const post = posts.find(p => p.id === req.params.id);
    
    if (!post) {
      return res.status(404).json({ 
        success: false,
        error: 'Post not found' 
      });
    }
    
    const postComments = comments.filter(c => c.postId === req.params.id);
    
    res.json({
      success: true,
      data: {
        ...post,
        comments: postComments
      }
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new post
app.post('/api/posts', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }
    
    const files = req.files || [];
    
    // Convert files to base64
    const base64Files = files.map(file => ({
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      base64: bufferToBase64(file.buffer)
    }));
    
    const post = {
      id: Date.now().toString(),
      title: escapeHtml(title),
      content: escapeHtml(content),
      files: base64Files,
      createdAt: new Date().toISOString(),
      author: req.user.username
    };
    
    posts.unshift(post);
    saveData();
    
    console.log(`✅ Created post: "${title}" with ${files.length} files by ${req.user.username}`);
    
    // Return post without base64 in response
    res.status(201).json({ 
      success: true, 
      data: {
        ...post,
        files: post.files.map(f => ({
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size
        }))
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update post
app.put('/api/posts/:id', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    const { title, content } = req.body;
    const postIndex = posts.findIndex(p => p.id === req.params.id);
    
    if (postIndex === -1) {
      return res.status(404).json({ 
        success: false,
        error: 'Post not found' 
      });
    }
    
    const files = req.files || [];
    let base64Files = posts[postIndex].files;
    
    if (files.length > 0) {
      base64Files = files.map(file => ({
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        base64: bufferToBase64(file.buffer)
      }));
    }
    
    posts[postIndex] = {
      ...posts[postIndex],
      title: title ? escapeHtml(title) : posts[postIndex].title,
      content: content ? escapeHtml(content) : posts[postIndex].content,
      files: base64Files,
      updatedAt: new Date().toISOString()
    };
    
    saveData();
    
    console.log(`✅ Updated post: "${posts[postIndex].title}"`);
    
    res.json({ 
      success: true, 
      data: {
        ...posts[postIndex],
        files: posts[postIndex].files.map(f => ({
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size
        }))
      }
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete post
app.delete('/api/posts/:id', authenticate, (req, res) => {
  try {
    const index = posts.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ 
        success: false,
        error: 'Post not found' 
      });
    }
    
    const post = posts[index];
    posts.splice(index, 1);
    comments = comments.filter(c => c.postId !== req.params.id);
    saveData();
    
    console.log(`🗑️ Deleted post: "${post.title}"`);
    
    res.json({ 
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific file from post
app.get('/api/posts/:postId/files/:fileIndex', (req, res) => {
  try {
    const post = posts.find(p => p.id === req.params.postId);
    
    if (!post) {
      return res.status(404).json({ 
        success: false,
        error: 'Post not found' 
      });
    }
    
    const fileIndex = parseInt(req.params.fileIndex);
    const file = post.files[fileIndex];
    
    if (!file) {
      return res.status(404).json({ 
        success: false,
        error: 'File not found' 
      });
    }
    
    const dataUrl = `data:${file.mimetype};base64,${file.base64}`;
    
    res.json({
      success: true,
      data: {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        dataUrl: dataUrl
      }
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ COMMENTS Routes ============

// Get comments for a post
app.get('/api/posts/:postId/comments', (req, res) => {
  try {
    const postComments = comments.filter(c => c.postId === req.params.postId);
    
    res.json({
      success: true,
      data: postComments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add comment to post
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const postId = req.params.id;
    
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'Name, email, and message are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email format' 
      });
    }
    
    const post = posts.find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        error: 'Post not found' 
      });
    }
    
    const comment = {
      id: Date.now().toString(),
      postId,
      name: escapeHtml(name),
      email: email,
      message: escapeHtml(message),
      createdAt: new Date().toISOString()
    };
    
    comments.push(comment);
    saveData();
    
    console.log(`✅ Comment added by ${name} on "${post.title}"`);
    
    res.status(201).json({ 
      success: true, 
      data: comment 
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete comment
app.delete('/api/comments/:id', authenticate, (req, res) => {
  try {
    const index = comments.findIndex(c => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ 
        success: false,
        error: 'Comment not found' 
      });
    }
    
    comments.splice(index, 1);
    saveData();
    
    console.log(`🗑️ Deleted comment`);
    
    res.json({ 
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Error Handler ============
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: 'File upload error: ' + err.message
    });
  }
  
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// ============ Graceful Shutdown ============
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, saving data and shutting down...');
  saveData();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, saving data and shutting down...');
  saveData();
  process.exit(0);
});

// ============ Start Server ============
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🤖 FRC QUY NHƠN API SERVER            ║
╠════════════════════════════════════════╣
║  🌐 URL: http://localhost:${PORT}         ║
║  📧 Email: DISABLED (Optional)         ║
║  🔐 Auth: JWT Token                    ║
║  💾 Storage: JSON Files                ║
║  🔄 CORS: ALL ORIGINS ALLOWED          ║
║  📊 Uptime: ${process.uptime()}s                  ║
╚════════════════════════════════════════╝
  `);
  console.log('✅ Server is running and ready to accept connections');
});
