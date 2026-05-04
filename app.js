// ══════════════════════════════════════════════
// GỐM BIÊN HÒA — PHÒNG TRƯNG BÀY NGHỆ THUẬT
// ══════════════════════════════════════════════

// API_KEY được load từ config.js (file riêng, không push lên GitHub)
// Xem config.example.js để biết cách thiết lập
const API_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite'];
function makeUrl(m) { return `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${API_KEY}`; }

// ── STATE ──
let currentFilter = 'all';
let currentView = 'grid';
let currentLbId = null;
let currentPage = 1;
const ITEMS_PER_PAGE = 24;

// ── NAV ──
function navTo(sel, el) {
  document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' });
  if (el) {
    document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
    el.classList.add('active');
  }
}

window.addEventListener('scroll', () => {
  const nav = document.getElementById('mainNav');
  nav.classList.toggle('scrolled', window.scrollY > 60);
  document.getElementById('backTop').classList.toggle('show', window.scrollY > 400);
  const sections = ['hero', 'collection', 'about', 'aiSection'];
  for (let i = sections.length - 1; i >= 0; i--) {
    const sec = document.getElementById(sections[i]);
    if (sec && sec.getBoundingClientRect().top <= 150) {
      document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
      const link = document.querySelector(`.nav-link[data-section="${sections[i]}"]`);
      if (link) link.classList.add('active');
      break;
    }
  }
});

// ── GET FILTERED LIST ──
function getFilteredList() {
  const q = (document.getElementById('collectionSearch')?.value || '').toLowerCase();
  let list = currentFilter === 'all'
    ? COLLECTION
    : COLLECTION.filter(p => p.filterKey === currentFilter || p.category.includes(currentFilter));
  if (q) list = list.filter(p => (p.name + p.material + p.category + p.ma_bt + p.period).toLowerCase().includes(q));
  return list;
}

// ── RENDER GALLERY ──
function render(list, page) {
  const g = document.getElementById('gallery');
  const e = document.getElementById('emptyState');
  const stats = document.getElementById('collectionStats');

  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;
  currentPage = page;

  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = Math.min(start + ITEMS_PER_PAGE, totalItems);
  const pageItems = list.slice(start, end);

  document.getElementById('navCount').textContent = totalItems;
  stats.textContent = `Hiển thị ${start + 1}–${end} / ${totalItems} hiện vật`;

  if (!totalItems) { g.innerHTML = ''; e.style.display = 'block'; renderPagination(0, 1); return; }
  e.style.display = 'none';

  g.className = currentView === 'list' ? 'gallery list-view' : 'gallery';
  g.innerHTML = pageItems.map(p => `
    <div class="gallery-item" id="gi-${p.id}" onclick="openLightbox(${p.id})">
      <div class="item-visual">
        <img class="item-img" src="${p.img}" alt="${p.name}" loading="lazy">
        <div class="item-overlay"><div class="view-btn">Xem chi tiết</div></div>
      </div>
      <div class="item-info">
        <div class="item-cat">${p.category}</div>
        <div class="item-name">${p.name}</div>
        <div class="item-meta">
          <div class="item-period">${p.period || ''}</div>
          <div class="item-material">${p.material.split('-')[0].trim()}</div>
        </div>
      </div>
    </div>
  `).join('');

  renderPagination(totalPages, page);
}

// ── PAGINATION ──
function renderPagination(totalPages, current) {
  const pg = document.getElementById('pagination');
  if (totalPages <= 1) { pg.innerHTML = ''; return; }

  let html = '';

  // Previous
  html += `<button class="pg-btn ${current <= 1 ? 'disabled' : ''}" onclick="goPage(${current - 1})" ${current <= 1 ? 'disabled' : ''}>‹</button>`;

  // Page numbers
  const maxVisible = 7;
  let startP = Math.max(1, current - Math.floor(maxVisible / 2));
  let endP = Math.min(totalPages, startP + maxVisible - 1);
  if (endP - startP < maxVisible - 1) startP = Math.max(1, endP - maxVisible + 1);

  if (startP > 1) {
    html += `<button class="pg-btn" onclick="goPage(1)">1</button>`;
    if (startP > 2) html += `<span class="pg-dots">…</span>`;
  }

  for (let i = startP; i <= endP; i++) {
    html += `<button class="pg-btn ${i === current ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }

  if (endP < totalPages) {
    if (endP < totalPages - 1) html += `<span class="pg-dots">…</span>`;
    html += `<button class="pg-btn" onclick="goPage(${totalPages})">${totalPages}</button>`;
  }

  // Next
  html += `<button class="pg-btn ${current >= totalPages ? 'disabled' : ''}" onclick="goPage(${current + 1})" ${current >= totalPages ? 'disabled' : ''}>›</button>`;

  pg.innerHTML = html;
}

function goPage(page) {
  const list = getFilteredList();
  const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  render(list, page);
  document.getElementById('collection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── FILTER & SEARCH ──
function filter(kw, el) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  currentFilter = kw;
  currentPage = 1;
  clearHighlights();
  applyCollectionFilters();
}

function searchCollection(q) { currentPage = 1; applyCollectionFilters(); }

function applyCollectionFilters() {
  const list = getFilteredList();
  render(list, currentPage);
}

function setView(v) {
  currentView = v;
  document.getElementById('vtGrid').classList.toggle('active', v === 'grid');
  document.getElementById('vtList').classList.toggle('active', v === 'list');
  applyCollectionFilters();
}

// ── LIGHTBOX ──
function openLightbox(id) {
  const p = COLLECTION.find(x => x.id === id);
  if (!p) return;
  currentLbId = id;
  document.getElementById('lbImg').src = p.img;
  document.getElementById('lbImg').alt = p.name;
  document.getElementById('lbCat').textContent = p.category;
  document.getElementById('lbName').textContent = p.name;
  document.getElementById('lbMa').textContent = 'Mã BT: ' + p.ma_bt;
  document.getElementById('lbMaterial').textContent = p.material;
  document.getElementById('lbSize').textContent = p.size || '—';
  document.getElementById('lbPeriod').textContent = p.period || '—';
  document.getElementById('lbOrigin').textContent = p.origin || '—';
  document.getElementById('lbOriginTag').textContent = '◆ ' + (p.origin || 'Trường CĐ MTTD Đồng Nai');
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
  currentLbId = null;
}

function lbNav(dir) {
  if (!currentLbId) return;
  const list = getFilteredList();
  const idx = list.findIndex(x => x.id === currentLbId);
  if (idx === -1) return;
  const next = (idx + dir + list.length) % list.length;
  openLightbox(list[next].id);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') lbNav(1);
  if (e.key === 'ArrowLeft') lbNav(-1);
});

// ── SWIPE GESTURES (mobile) ──
(function () {
  let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;
  const lb = document.getElementById('lightbox');

  lb.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  lb.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Horizontal swipe (minimum 50px, and more horizontal than vertical)
    if (absDx > 50 && absDx > absDy * 1.2) {
      if (dx < 0) lbNav(1);   // swipe left → next
      else lbNav(-1);          // swipe right → prev
    }
    // Vertical swipe down to close (minimum 80px)
    else if (dy > 80 && absDy > absDx * 1.5) {
      closeLightbox();
    }
  }, { passive: true });
})();

// ── HIGHLIGHTS ──
function clearHighlights() {
  document.querySelectorAll('.gallery-item.lit').forEach(el => el.classList.remove('lit'));
}

// ── AI CHAT ──
const SYS_PROMPT = `Bạn là giám tuyển cao cấp của phòng trưng bày "Gốm Biên Hòa" tại Trường Cao đẳng Mỹ thuật Trang trí Đồng Nai. Bạn có kiến thức chuyên sâu, chính xác về lịch sử, kỹ thuật, và giá trị nghệ thuật của dòng gốm mỹ nghệ Biên Hòa.

## LỊCH SỬ GỐM BIÊN HÒA (theo nguồn chính thống)

### Nguồn gốc nghề gốm tại Biên Hòa
- Thế kỷ XVII: Nghề gốm tại Biên Hòa hình thành từ sự hội tụ của ba dòng gốm: gốm bản địa Việt, gốm người Hoa di dân, và gốm Chăm-pa. Vùng đất Đồng Nai có nguồn đất sét, cao lanh, đá ong thiên nhiên phong phú — nguyên liệu lý tưởng cho nghề gốm.
- Làng gốm tập trung tại các phường: Tân Vạn, Bửu Long, Hóa An, Tân Hạnh (TP. Biên Hòa, Đồng Nai).

### Trường Dạy nghề Biên Hòa — cái nôi của gốm mỹ nghệ
- 15/3/1903: Khai giảng khóa đầu tiên Trường Dạy nghề Biên Hòa (tên Pháp: École Professionnelle de Biên Hòa), thường gọi là "Trường Bá nghệ Biên Hòa" — một trong những trường dạy nghề đầu tiên tại Nam Kỳ.
- Mục đích ban đầu: đào tạo thợ lành nghề phục vụ khai thác thuộc địa, nhưng trường nhanh chóng trở thành nơi kết hợp kỹ thuật phương Tây với truyền thống bản địa.

### Thời kỳ hoàng kim — Vợ chồng Balick (1923–1950)
- 1923: Ông Robert Balick được bổ nhiệm làm Hiệu trưởng, bà Mariette Balick (tốt nghiệp trường gốm Limoges, Pháp) phụ trách Ban Gốm. Trường đổi tên thành "Trường Mỹ nghệ Bản xứ Biên Hòa" (École d'Art Indigène de Biên Hòa).
- Bà Mariette nhận thấy men gốm phương Tây không phù hợp với chất liệu đất sét Biên Hòa, nên đã cùng các cộng sự người Việt nghiên cứu tạo ra những loại men mới từ nguyên liệu thiên nhiên có sẵn tại địa phương: tro rơm, tro trấu, đá trắng An Giang, thủy tinh vụn, mạt đồng, đá đỏ Biên Hòa...
- Kết quả: Tạo ra dòng men xanh đồng huyền thoại "Vert de Biên Hòa" và hệ thống màu men đặc trưng.
- Phong cách: Kết hợp tạo dáng phương Tây với hoa văn chạm khắc Á Đông (tượng Phật, rồng phượng, tùng cúc trúc mai, họa tiết "bá hoa").

### Vươn tầm quốc tế
- 1925: Gốm Biên Hòa tỏa sáng tại Triển lãm Quốc tế về Mỹ thuật Trang trí và Công nghệ hiện đại tại Paris (Exposition Internationale des Arts Décoratifs et Industriels Modernes), giành huy chương vàng.
- 1931: Tham dự Triển lãm Thuộc địa Quốc tế tại Paris (Exposition Coloniale Internationale de 1931), tiếp tục được đánh giá cao.
- 1933: Sản phẩm gốm Biên Hòa chiếm lĩnh thị trường quốc tế sau các cuộc triển lãm tại Paris, Nhật Bản, Thái Lan.
- Khoảng 1950: Vợ chồng Balick về Pháp. Hợp tác xã Mỹ nghệ được tách ra, nghệ nhân tiếp tục phát huy sáng tạo.

### Trường qua các thời kỳ
- Trường Mỹ nghệ Thực hành Biên Hòa → Trường Kỹ thuật Biên Hòa → Trường Trung học Mỹ thuật Trang trí Đồng Nai → Hiện nay: Trường Cao đẳng Mỹ thuật Trang trí Đồng Nai (dncda.edu.vn).
- Trong khuôn viên trường có không gian "Điểm đến Gốm Biên Hòa — Con đường di sản" (diện tích gần 1.000m²) — bảo tàng mở trưng bày gốm cổ và đương đại.

## DÒNG MEN ĐẶC TRƯNG (chính xác theo nguồn gốc)

1. **Men xanh đồng (Vert de Biên Hòa)**: Màu xanh đồng đặc trưng nhất, "linh hồn" của gốm Biên Hòa. Được tạo từ mạt đồng kết hợp với các khoáng chất địa phương. Khi nung ở nhiệt độ cao, men tạo sắc xanh huyền ảo với hiệu ứng "trổ bông" (speckled) độc đáo. Thế giới gọi là "Vert de Biên Hòa" — không nơi nào tái tạo được sắc xanh này.

2. **Men xanh dương (Cobalt)**: Tạo từ coban, cho sắc xanh lam sâu, thường gọi là "xanh cô ban".

3. **Men đá đỏ / Men đá ong**: Từ đá ong (laterite) vùng Biên Hòa, cho sắc nâu đỏ ấm áp đặc trưng.

4. **Men ta / Men tro rơm**: Công thức gia truyền từ tro rơm, tro trấu, tro củi. Tạo bề mặt mộc mạc, trầm ấm, sắc trắng ta.

5. **Men trắng ta**: Men trắng truyền thống, dùng làm nền hoặc kết hợp với các loại men khác.

6. **Men rạn (Craquelé)**: Mạng lưới vết nứt tự nhiên hình thành khi làm nguội, tạo vẻ đẹp cổ kính.

7. **Men celadon**: Xanh ngọc bích thanh thoát, ảnh hưởng từ gốm sứ Trung Hoa.

## KỸ THUẬT TẠO TÁC

1. **Khắc chìm (Gravure en creux)**: Kỹ thuật phổ biến nhất và đặc trưng nhất. Các đường khắc đóng vai trò "bờ ngăn" (cloisons), giúp các mảng màu men khác nhau không lem vào nhau khi nung.

2. **Đắp nổi / Chạm nổi (Relief)**: Tạo hoa văn, hình tượng nổi lên bề mặt bằng cách đắp đất sét rồi tô men nhiều lớp.

3. **Chạm lộng (Ajouré)**: Kỹ thuật chạm xuyên thủng, khoét thủng tạo hoa văn trang trí tinh xảo.

4. **Nặn tay (Modelage)**: Tạo hình tượng tròn bằng tay — đặc biệt cho các tượng trang trí.

5. **Bàn xoay (Tour)**: Tạo dáng bình, lọ, ấm trên bàn xoay truyền thống.

## QUY TẮC TRẢ LỜI
- Trả lời bằng tiếng Việt, văn phong lịch lãm, uyên bác như một giám tuyển bảo tàng chuyên nghiệp.
- Trả lời ĐẦY ĐỦ, CHI TIẾT, CHÍNH XÁC, NHIỀU Ý. Mỗi câu trả lời tối thiểu 400 từ.
- Chia câu trả lời thành NHIỀU PHẦN rõ ràng với tiêu đề (dùng **in đậm**). Ví dụ: **Lịch sử**, **Kỹ thuật**, **Đặc điểm nổi bật**, **Giá trị nghệ thuật**, **Hiện vật tiêu biểu**.
- Sử dụng danh sách gạch đầu dòng khi liệt kê nhiều ý.
- Khi nói về kỹ thuật, men, lịch sử — trích dẫn chi tiết cụ thể với năm, tên người, địa điểm.
- Luôn mở rộng câu trả lời bằng cách: so sánh, phân tích, đưa ra bối cảnh lịch sử, kể giai thoại thú vị, và liên hệ với các hiện vật cụ thể trong bộ sưu tập.
- Nếu câu hỏi liên quan đến hiện vật trong bộ sưu tập, liệt kê NHIỀU hiện vật phù hợp (tối đa 5-8) kèm mô tả ngắn, và gợi ý Mã BT cuối câu: [IDs:1,3,5,7]
- Cuối mỗi câu trả lời, gợi ý 1-2 câu hỏi liên quan để người đọc khám phá thêm.
- KHÔNG bịa thông tin. Nếu không chắc chắn, nói rõ giới hạn kiến thức.
- Bộ sưu tập hiện có 268 hiện vật số hóa.

## BỘ SƯU TẬP HIỆN VẬT (268 hiện vật)
` + COLLECTION.map(p => `[ID:${p.id}] Mã ${p.ma_bt}: ${p.name} | ${p.category} | ${p.material} | ${p.size} | ${p.period}`).join('\n');

let chatHistory = [];

async function sendChat() {
  const input = document.getElementById('chatInput');
  const q = input.value.trim();
  if (!q) return;
  input.value = '';

  const msgs = document.getElementById('chatMessages');
  msgs.innerHTML += `<div class="chat-msg user"><div class="msg-avatar">●</div><div class="msg-body"><div class="msg-name">Bạn</div><div class="msg-text">${escHtml(q)}</div></div></div>`;

  const typingId = 'typing-' + Date.now();
  msgs.innerHTML += `<div class="chat-msg ai" id="${typingId}"><div class="msg-avatar">✦</div><div class="msg-body"><div class="msg-name">Giám tuyển AI</div><div class="msg-text"><div class="typing-dots"><span></span><span></span><span></span></div></div></div></div>`;
  msgs.scrollTop = msgs.scrollHeight;

  const btn = document.getElementById('chatSendBtn');
  btn.disabled = true;
  chatHistory.push({ role: 'user', parts: [{ text: q }] });

  try {
    const reqBody = JSON.stringify({
      system_instruction: { parts: [{ text: SYS_PROMPT }] },
      contents: chatHistory,
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7 }
    });

    let data = null;
    let lastErr = '';
    for (const model of API_MODELS) {
      const res = await fetch(makeUrl(model), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: reqBody
      });
      data = await res.json();
      if (res.ok && data.candidates) break;
      lastErr = data?.error?.message || `Lỗi ${res.status}`;
      data = null;
    }

    if (!data || !data.candidates) {
      chatHistory.pop();
      const typing = document.getElementById(typingId);
      if (typing) typing.querySelector('.msg-text').textContent = '⚠ ' + (lastErr || 'Không nhận được phản hồi.');
      return;
    }

    const answer = data.candidates[0]?.content?.parts?.[0]?.text || 'Xin lỗi, tôi không thể trả lời lúc này.';
    chatHistory.push({ role: 'model', parts: [{ text: answer }] });

    const displayText = answer.replace(/\[IDs?:[\s\d,]+\]/gi, '').trim();
    const typing = document.getElementById(typingId);
    if (typing) typing.querySelector('.msg-text').innerHTML = escHtml(displayText);

    const idMatch = answer.match(/\[IDs?:\s*([\d,\s]+)\]/i);
    if (idMatch) {
      const ids = idMatch[1].split(',').map(s => parseInt(s.trim())).filter(Boolean);
      clearHighlights();
      ids.forEach(id => {
        const el = document.getElementById(`gi-${id}`);
        if (el) el.classList.add('lit');
      });
    }
  } catch (e) {
    chatHistory.pop();
    const typing = document.getElementById(typingId);
    if (typing) typing.querySelector('.msg-text').textContent = 'Không thể kết nối AI. Vui lòng thử lại.';
  } finally {
    btn.disabled = false;
    msgs.scrollTop = msgs.scrollHeight;
  }
}

function askSuggestion(btn) {
  document.getElementById('chatInput').value = btn.textContent;
  sendChat();
}

function escHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'); }

// ── COUNTER ANIMATION ──
function animateCounters() {
  document.querySelectorAll('#aboutStats .stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const dur = 1500;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * ease) + (target > 100 ? '+' : '');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// ── FADE-IN OBSERVER ──
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      if (entry.target.closest('#about') && entry.target.closest('.about-section')) animateCounters();
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounters(); counterObs.unobserve(e.target); } });
}, { threshold: 0.3 });
const aboutStats = document.getElementById('aboutStats');
if (aboutStats) counterObs.observe(aboutStats);

// ── INIT ──
render(COLLECTION, 1);

// Auto-open piece from QR code URL (?piece=ID)
const urlPiece = new URLSearchParams(window.location.search).get('piece');
if (urlPiece) {
  const pid = parseInt(urlPiece);
  if (COLLECTION.find(p => p.id === pid)) {
    setTimeout(() => openLightbox(pid), 600);
  }
}
