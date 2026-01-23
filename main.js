const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'frc-qn-secret-key-2025';

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' })); // Tăng limit để nhận base64
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static('public'));

// Cấu hình multer cho upload (chuyển sang memory storage)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Cấu hình email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kzocean.715@gmail.com",
    pass: "sllekhycwwnqarcp",
  },
  logger: true,
  debug: true,
});

// Database đơn giản - tất cả lưu trong JSON
let posts = [];
let comments = [];

// Load dữ liệu từ file
const loadData = () => {
  try {
    if (fs.existsSync('posts.json')) {
      posts = JSON.parse(fs.readFileSync('posts.json', 'utf8'));
      console.log(`📚 Loaded ${posts.length} posts`);
    }
    if (fs.existsSync('comments.json')) {
      comments = JSON.parse(fs.readFileSync('comments.json', 'utf8'));
      console.log(`💬 Loaded ${comments.length} comments`);
    }
  } catch (error) {
    console.error('❌ Error loading data:', error);
  }
};

// Lưu dữ liệu vào file
const saveData = () => {
  try {
    fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));
    fs.writeFileSync('comments.json', JSON.stringify(comments, null, 2));
    console.log('💾 Data saved successfully');
  } catch (error) {
    console.error('❌ Error saving data:', error);
  }
};

loadData();

// Admin credentials
const ADMIN = {
  username: 'frcqn',
  passwordHash: bcrypt.hashSync('00000000', 10)
};

// Middleware xác thực
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper: Convert buffer to base64
const bufferToBase64 = (buffer) => {
  return buffer.toString('base64');
};

// API Routes

// Đăng nhập admin
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN.username && await bcrypt.compare(password, ADMIN.passwordHash)) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Tạo bài viết mới - Lưu files dưới dạng base64
app.post('/api/posts', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    const { title, content } = req.body;
    const files = req.files || [];
    
    // Convert files sang base64
    const base64Files = files.map(file => ({
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      base64: bufferToBase64(file.buffer)
    }));
    
    const post = {
      id: Date.now().toString(),
      title,
      content,
      files: base64Files,
      createdAt: new Date().toISOString(),
      author: req.user.username
    };
    
    posts.unshift(post);
    saveData();
    
    console.log(`✅ Created post: "${title}" with ${files.length} files`);
    res.json({ success: true, post });
  } catch (error) {
    console.error('❌ Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Lấy danh sách bài viết (không bao gồm base64 để giảm data)
app.get('/api/posts', (req, res) => {
  const postsPreview = posts.map(post => ({
    ...post,
    files: post.files.map(f => ({
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      hasFile: true
    }))
  }));
  res.json(postsPreview);
});

// Lấy chi tiết bài viết (bao gồm base64)
app.get('/api/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  const postComments = comments.filter(c => c.postId === req.params.id);
  res.json({ ...post, comments: postComments });
});

// Lấy file cụ thể
app.get('/api/posts/:postId/files/:fileIndex', (req, res) => {
  const post = posts.find(p => p.id === req.params.postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  const fileIndex = parseInt(req.params.fileIndex);
  const file = post.files[fileIndex];
  
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Trả về file dưới dạng base64 data URL
  const dataUrl = `data:${file.mimetype};base64,${file.base64}`;
  res.json({ 
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    dataUrl: dataUrl
  });
});

// Xóa bài viết
app.delete('/api/posts/:id', authenticate, (req, res) => {
  const index = posts.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  const post = posts[index];
  posts.splice(index, 1);
  comments = comments.filter(c => c.postId !== req.params.id);
  saveData();
  
  console.log(`🗑️ Deleted post: "${post.title}"`);
  res.json({ success: true });
});

// Thêm bình luận
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const postId = req.params.id;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    
    const post = posts.find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const comment = {
      id: Date.now().toString(),
      postId,
      name,
      email,
      message,
      createdAt: new Date().toISOString()
    };
    
    comments.push(comment);
    saveData();
    
    // Format thời gian
    const commentDate = new Date(comment.createdAt).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Gửi email thông báo với template FRC đẹp
    const mailOptions = {
      from: '"FRC Quy Nhơn" <kzocean.715@gmail.com>',
      to: 'kzemytb547@gmail.com',
      subject: `🔔 [FRC] Bình luận mới: ${post.title}`,
      html: `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                  
                  <!-- Header with FRC Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0066cc 0%, #0099ff 100%); padding: 40px 30px; text-align: center;">
                      <img src="https://i.imgur.com/ue2k13.jpg" alt="FRC Logo" style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid #ffffff; margin-bottom: 15px;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        FPTU Robotics Club
                      </h1>
                      <p style="color: #e6f3ff; margin: 8px 0 0 0; font-size: 14px; letter-spacing: 1px;">
                        FRC QUY NHƠN
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Notification Badge -->
                  <tr>
                    <td style="padding: 30px 30px 20px 30px;">
                      <div style="background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%); color: #ffffff; padding: 12px 20px; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 3px 8px rgba(255,107,53,0.3);">
                        🔔 Bình luận mới
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Post Information -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <div style="background: #f8f9fa; border-left: 4px solid #0099ff; padding: 20px; border-radius: 8px;">
                        <p style="margin: 0 0 8px 0; color: #666; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                          Bài viết
                        </p>
                        <h2 style="margin: 0; color: #1a1a1a; font-size: 20px; font-weight: 600; line-height: 1.4;">
                          ${post.title}
                        </h2>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Commenter Information -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <div style="background: #ffffff; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-bottom: 12px;">
                              <strong style="color: #0099ff; font-size: 14px;">👤 Người bình luận:</strong>
                              <span style="color: #333; font-size: 16px; margin-left: 8px;">${name}</span>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong style="color: #0099ff; font-size: 14px;">📧 Email:</strong>
                              <a href="mailto:${email}" style="color: #0066cc; text-decoration: none; margin-left: 8px; font-size: 15px;">${email}</a>
                            </td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Comment Content -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px;">
                      <div style="background: #ffffff; border: 2px solid #e9ecef; border-radius: 8px; padding: 0; overflow: hidden;">
                        <div style="background: #0099ff; color: #ffffff; padding: 12px 20px; font-weight: 600; font-size: 14px;">
                          💬 Nội dung bình luận
                        </div>
                        <div style="padding: 20px; color: #333; font-size: 15px; line-height: 1.7;">
                          ${message.replace(/\n/g, '<br>')}
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Timestamp -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px;">
                      <div style="text-align: center; color: #999; font-size: 13px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <strong style="color: #666;">⏰ Thời gian:</strong> ${commentDate}
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
                      <p style="margin: 0 0 15px 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                        FPTU Robotics Club - FRC Quy Nhơn
                      </p>
                      <p style="margin: 0 0 10px 0; color: #b3b3b3; font-size: 13px;">
                        Inspiring Innovation, Building the Future
                      </p>
                      <div style="margin: 20px 0 0 0; padding-top: 20px; border-top: 1px solid #404040;">
                        <p style="margin: 0; color: #808080; font-size: 12px;">
                          © 2025 FPTU Robotics Club. All rights reserved.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Comment added by ${name} on "${post.title}"`);
    
    res.json({ success: true, comment });
  } catch (error) {
    console.error('❌ Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Xóa comment (admin only)
app.delete('/api/comments/:id', authenticate, (req, res) => {
  const index = comments.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  
  comments.splice(index, 1);
  saveData();
  
  console.log(`🗑️ Deleted comment`);
  res.json({ success: true });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🤖 FRC QUY NHƠN SERVER                ║
╠════════════════════════════════════════╣
║  🌐 Server: http://localhost:${PORT}      ║
║  📧 Email: ENABLED                     ║
║  🔐 Auth: ACTIVE                       ║
║  💾 Storage: Base64 (JSON)            ║
╚════════════════════════════════════════╝
  `);
});
