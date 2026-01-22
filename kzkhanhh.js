
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
