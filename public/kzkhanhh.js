const app = document.getElementById('app');
const API_URL = '';

const state = {
    currentPage: 'home',
    isAdmin: false,
    uploadedFiles: [],
    lightboxImages: [],
    currentLightboxIndex: 0
};

function createStars() {
    const sc = document.getElementById('stars');
    const n = 40;
    
    for (let i = 0; i < n; i++) {
        const s = document.createElement('div');
        s.className = 'star';
        
        const sz = Math.random() * 2.5 + 1.5;
        s.style.width = sz + 'px';
        s.style.height = sz + 'px';
        
        s.style.left = Math.random() * 100 + '%';
        s.style.top = -10 + '%';
        
        const dur = Math.random() * 4 + 6;
        s.style.animationDuration = `${Math.random() * 2 + 2}s, ${dur}s`;
        s.style.animationDelay = `${Math.random() * 3}s, ${Math.random() * 5}s`;
        
        sc.appendChild(s);
    }
}

function navigate(page) {
    state.currentPage = page;
    
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
    
    if (page === 'home') {
        window.history.pushState({}, '', '/');
        renderHome();
    } else if (page === 'posts') {
        window.history.pushState({}, '', '/posts');
        renderPosts();
    } else if (page === 'admin') {
        window.history.pushState({}, '', '/admin');
        renderAdmin();
    }
}

function renderHome() {
    app.innerHTML = `
        <div class="container">
            <div class="header">
                <div class="logo-wrapper">
                    <div class="logo-container">
                        <img src="https://files.catbox.moe/ue2k13.jpg" alt="FRC Logo" onerror="this.style.background='linear-gradient(135deg, #0099ff, #00d4ff)'">
                    </div>
                </div>
                <h1>FPTU Robotics Club</h1>
                <p class="subtitle">FRC Quy Nhơn</p>
                <p class="tagline">Innovate, Build, Inspire</p>
            </div>

            <div class="content-grid">
                <div class="card">
                    <div class="card-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                        </svg>
                    </div>
                    <h3>Research & Innovation</h3>
                    <p>Advancing robotics and intelligent automation.</p>
                </div>

                <div class="card">
                    <div class="card-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                    </div>
                    <h3>Collaborative Community</h3>
                    <p>Connecting engineers to advance robotics.</p>
                </div>

                <div class="card">
                    <div class="card-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                    </div>
                    <h3>Technical Excellence</h3>
                    <p>Mastering robotics through projects, competitions, and training.</p>
                </div>
            </div>

            <div class="info-section">
                <div class="info-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span>FPT University Quy Nhon, Quy Nhon, Vietnam</span>
                </div>
                <div class="info-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    <span>frc.quynhon@gmail.com</span>
                </div>
            </div>

            <div class="social-section">
                <h2 class="section-title">Connect With Us</h2>
                <div class="social-links">
                    <a href="https://www.facebook.com/frc.quynhon" target="_blank" class="social-btn">
                        <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Facebook
                    </a>
                    <a href="https://www.instagram.com/frc.qn" target="_blank" class="social-btn">
                        <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        Instagram
                    </a>
                    <a href="https://tiktok.com/@fpturobotics.club" target="_blank" class="social-btn">
                        <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                        TikTok
                    </a>
                    <a href="mailto:frc.quynhon@gmail.com" class="social-btn">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        Email
                    </a>
                </div>
            </div>
        </div>
    `;
}

async function renderPosts() {
    try {
        const response = await fetch(`${API_URL}/api/posts`);
        const posts = await response.json();
        
        app.innerHTML = `
            <div class="container">
                <div class="header">
                    <h1>Latest Posts</h1>
                    <p class="tagline">Stay updated with our latest activities and announcements</p>
                </div>
                
                <div class="posts-container">
                    ${posts.map(post => renderPostCard(post)).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        app.innerHTML = `
            <div class="container">
                <div class="alert alert-error">Không thể tải bài viết. Vui lòng thử lại sau.</div>
            </div>
        `;
    }
}

function renderPostCard(post) {
    const images = post.images ? JSON.parse(post.images) : [];
    const captionLength = post.caption ? post.caption.length : 0;
    const shouldCollapse = captionLength > 300;
    
    return `
        <div class="post-card">
            <div class="post-header">
                <img src="https://files.catbox.moe/ue2k13.jpg" alt="FRC" class="post-avatar">
                <div class="post-meta">
                    <h3>FRC Quy Nhơn</h3>
                    <div class="post-date">${formatDate(post.created_at)}</div>
                </div>
            </div>
            
            ${post.caption ? `
                <div class="post-caption ${shouldCollapse ? 'collapsed' : ''}" id="caption-${post.id}">
                    ${post.caption}
                </div>
                ${shouldCollapse ? `
                    <div class="read-more-btn">
                        <button onclick="toggleCaption('${post.id}')">Xem thêm</button>
                    </div>
                ` : ''}
            ` : ''}
            
            ${images.length > 0 ? renderPostImages(images, post.id) : ''}
            
            <div class="post-actions">
                <button class="action-btn" onclick="toggleComments('${post.id}')">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    Comment
                </button>
            </div>
            
            <div class="comments-section hidden" id="comments-${post.id}">
                <form class="comment-form" onsubmit="submitComment(event, '${post.id}')">
                    <div class="comment-input-wrapper">
                        <input type="email" name="email" class="comment-input" placeholder="Nhập email của bạn để bình luận..." required>
                        <button type="submit" class="send-btn">Gửi</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function renderPostImages(images, postId) {
    if (images.length === 0) return '';
    
    if (images.length === 1) {
        return `
            <div class="post-images">
                <img src="/uploads/${images[0]}" alt="Post image" class="single-image" onclick="openLightbox(['/uploads/${images[0]}'], 0)">
            </div>
        `;
    }
    
    const displayCount = Math.min(images.length, 6);
    const remaining = images.length - displayCount;
    const gridClass = images.length === 2 ? 'count-2' : 
                      images.length === 3 ? 'count-3' : 
                      images.length === 4 ? 'count-4' : 
                      images.length === 5 ? 'count-5' : 'count-more';
    
    const imageUrls = images.map(img => `/uploads/${img}`);
    
    return `
        <div class="post-images">
            <div class="multi-images ${gridClass}">
                ${images.slice(0, displayCount).map((img, idx) => `
                    <div class="img-wrapper" onclick="openLightbox(${JSON.stringify(imageUrls)}, ${idx})">
                        <img src="/uploads/${img}" alt="Post image ${idx + 1}">
                        ${idx === displayCount - 1 && remaining > 0 ? `<div class="more-overlay">+${remaining}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toggleCaption(postId) {
    const caption = document.getElementById(`caption-${postId}`);
    const btn = caption.nextElementSibling.querySelector('button');
    
    if (caption.classList.contains('collapsed')) {
        caption.classList.remove('collapsed');
        btn.textContent = 'Ẩn bớt';
    } else {
        caption.classList.add('collapsed');
        btn.textContent = 'Xem thêm';
    }
}

function toggleComments(postId) {
    const comments = document.getElementById(`comments-${postId}`);
    comments.classList.toggle('hidden');
}

async function submitComment(event, postId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const email = formData.get('email');
    
    const textArea = document.createElement('textarea');
    textArea.placeholder = 'Nhập bình luận của bạn...';
    textArea.className = 'comment-input';
    textArea.style.marginTop = '10px';
    textArea.rows = 3;
    
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'send-btn';
    submitBtn.textContent = 'Gửi bình luận';
    submitBtn.style.marginTop = '10px';
    
    form.innerHTML = '';
    form.appendChild(textArea);
    form.appendChild(submitBtn);
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        const comment = textArea.value.trim();
        
        if (!comment) {
            alert('Vui lòng nhập nội dung bình luận');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/api/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId, email, comment })
            });
            
            const result = await response.json();
            
            if (result.success) {
                form.innerHTML = '<div class="alert alert-success">Cảm ơn bạn đã bình luận! Chúng tôi đã nhận được ý kiến của bạn.</div>';
            } else {
                form.innerHTML = '<div class="alert alert-error">Không thể gửi bình luận. Vui lòng thử lại.</div>';
            }
        } catch (error) {
            form.innerHTML = '<div class="alert alert-error">Không thể gửi bình luận. Vui lòng thử lại.</div>';
        }
    };
}

function openLightbox(images, index) {
    state.lightboxImages = images;
    state.currentLightboxIndex = index;
    
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    
    img.src = images[index];
    lightbox.classList.add('active');
    
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function navigateLightbox(direction) {
    state.currentLightboxIndex += direction;
    
    if (state.currentLightboxIndex < 0) {
        state.currentLightboxIndex = state.lightboxImages.length - 1;
    } else if (state.currentLightboxIndex >= state.lightboxImages.length) {
        state.currentLightboxIndex = 0;
    }
    
    const img = document.getElementById('lightbox-img');
    img.src = state.lightboxImages[state.currentLightboxIndex];
}

function renderAdmin() {
    if (!state.isAdmin) {
        app.innerHTML = `
            <div class="container">
                <div class="admin-section">
                    <h1 style="color: #ffffff; text-align: center; margin-bottom: 40px;">Admin Login</h1>
                    <div class="admin-login">
                        <form onsubmit="adminLogin(event)">
                            <div class="form-group">
                                <label class="form-label">Admin ID</label>
                                <input type="text" name="adminId" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Access Code</label>
                                <input type="password" name="accessCode" class="form-input" required>
                            </div>
                            <button type="submit" class="btn-primary">Login</button>
                            <div id="login-message"></div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    } else {
        renderAdminPanel();
    }
}

function adminLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const adminId = formData.get('adminId');
    const accessCode = formData.get('accessCode');
    
    const messageDiv = document.getElementById('login-message');
    
    if (adminId === 'frcqn' && accessCode === '01010101') {
        state.isAdmin = true;
        messageDiv.innerHTML = '<div class="alert alert-success">Login successful!</div>';
        setTimeout(() => renderAdminPanel(), 500);
    } else {
        messageDiv.innerHTML = '<div class="alert alert-error">Invalid credentials!</div>';
    }
}

function renderAdminPanel() {
    state.uploadedFiles = [];
    
    app.innerHTML = `
        <div class="container">
            <div class="admin-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
                    <h1 style="color: #ffffff;">Create New Post</h1>
                    <button class="btn-secondary" onclick="adminLogout()">Logout</button>
                </div>
                <div class="admin-panel">
                    <form onsubmit="createPost(event)">
                        <div class="form-group">
                            <label class="form-label">Caption</label>
                            <textarea name="caption" class="form-textarea" placeholder="Chia sẻ điều gì đó với mọi người..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Images (optional)</label>
                            <div class="file-upload-area" id="upload-area" onclick="document.getElementById('file-input').click()">
                                <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                </svg>
                                <div class="upload-text">Click to upload or drag and drop</div>
                                <div class="upload-hint">JPG, PNG, GIF (max 5MB each)</div>
                            </div>
                            <input type="file" id="file-input" multiple accept="image/*" style="display: none;" onchange="handleFileSelect(event)">
                            <div id="preview-grid" class="preview-grid"></div>
                        </div>
                        
                        <button type="submit" class="btn-primary" id="submit-btn">Publish Post</button>
                        <div id="post-message"></div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    setupDragDrop();
}

function setupDragDrop() {
    const uploadArea = document.getElementById('upload-area');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    handleFiles(files);
}

function handleFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    imageFiles.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
            alert(`File ${file.name} quá lớn. Kích thước tối đa là 5MB.`);
            return;
        }
        
        state.uploadedFiles.push(file);
    });
    
    updatePreview();
}

function updatePreview() {
    const previewGrid = document.getElementById('preview-grid');
    
    previewGrid.innerHTML = state.uploadedFiles.map((file, index) => {
        const url = URL.createObjectURL(file);
        return `
            <div class="preview-item">
                <img src="${url}" alt="Preview ${index + 1}">
                <button type="button" class="remove-img" onclick="removeFile(${index})">×</button>
            </div>
        `;
    }).join('');
}

function removeFile(index) {
    state.uploadedFiles.splice(index, 1);
    updatePreview();
}

function adminLogout() {
    state.isAdmin = false;
    navigate('admin');
}

async function createPost(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const caption = formData.get('caption');
    
    if (!caption && state.uploadedFiles.length === 0) {
        alert('Vui lòng nhập caption hoặc upload ít nhất 1 ảnh');
        return;
    }
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang đăng...';
    
    const postFormData = new FormData();
    postFormData.append('caption', caption);
    
    state.uploadedFiles.forEach((file, index) => {
        postFormData.append('images', file);
    });
    
    try {
        const response = await fetch(`${API_URL}/api/posts`, {
            method: 'POST',
            body: postFormData
        });
        
        const result = await response.json();
        
        const messageDiv = document.getElementById('post-message');
        if (result.success) {
            messageDiv.innerHTML = '<div class="alert alert-success">Post published successfully!</div>';
            form.reset();
            state.uploadedFiles = [];
            updatePreview();
            setTimeout(() => {
                navigate('posts');
            }, 1500);
        } else {
            messageDiv.innerHTML = '<div class="alert alert-error">Failed to publish post. Please try again.</div>';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Publish Post';
        }
    } catch (error) {
        const messageDiv = document.getElementById('post-message');
        messageDiv.innerHTML = '<div class="alert alert-error">Failed to publish post. Please try again.</div>';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publish Post';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    createStars();
    
    const path = window.location.pathname;
    if (path === '/posts') {
        navigate('posts');
    } else if (path.startsWith('/post/')) {
        const postId = path.split('/')[2];
        navigate('post', postId);
    } else if (path === '/admin') {
        navigate('admin');
    } else {
        navigate('home');
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigate(page);
        });
    });
});

window.addEventListener('popstate', () => {
    const path = window.location.pathname;
    if (path === '/posts') {
        navigate('posts');
    } else if (path.startsWith('/post/')) {
        const postId = path.split('/')[2];
        navigate('post', postId);
    } else if (path === '/admin') {
        navigate('admin');
    } else {
        navigate('home');
    }
});