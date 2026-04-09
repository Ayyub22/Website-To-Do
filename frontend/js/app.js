// ============================================
// Config
// ============================================
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = (isLocalhost && window.location.port !== '3000') 
  ? 'http://localhost:3000/api/todos' 
  : '/api/todos';

// ============================================
// State
// ============================================
let authToken = localStorage.getItem('taskflow_token');
let activeUser = null;

let todos = [];
let stats = { total: 0, completed: 0, active: 0, highPriority: 0, overdue: 0 };
let categories = [];
let currentFilter = 'all';
let currentPriority = 'all';
let currentCategory = 'all';
let searchQuery = '';
let deleteTargetId = null;

// ============================================
// DOM Elements
// ============================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ============================================
// Auth & App UI Switching
// ============================================
const authWrapper = $('#auth-wrapper');
const appWrapper = $('#app-wrapper');
const loginFormWrapper = $('#login-form');
const registerFormWrapper = $('#register-form');
const goToRegister = $('#go-to-register');
const goToLogin = $('#go-to-login');
const btnLogout = $('#btn-logout');

const loginEmail = $('#login-email');
const loginPassword = $('#login-password');

const regUsername = $('#reg-username');
const regEmail = $('#reg-email');
const regPassword = $('#reg-password');

const todoForm = $('#todo-form');
const todoTitle = $('#todo-title');
const todoDesc = $('#todo-description');
const todoCategory = $('#todo-category');
const todoDueDate = $('#todo-due-date');
const todoList = $('#todo-list');
const loadingEl = $('#loading');
const emptyState = $('#empty-state');
const addPanel = $('#add-panel');
const btnOpenForm = $('#btn-open-form');
const btnCancelForm = $('#btn-cancel-form');

// Stats
const statTotal = $('#stat-total');
const statActive = $('#stat-active');
const statCompleted = $('#stat-completed');
const statOverdue = $('#stat-overdue');
const progressFill = $('#progress-fill');
const progressPct = $('#progress-pct');

// Search
const searchInput = $('#search-input');
const searchClear = $('#search-clear');

// Sidebar
const sidebar = $('#sidebar');
const menuToggle = $('#menu-toggle');
const sidebarClose = $('#sidebar-close');
const categoryList = $('#category-list');
const categorySuggestions = $('#category-suggestions');

// Filter pills
const filterPills = $$('.pill');
const priorityPills = $$('.priority-pill');

// Bulk actions
const btnMarkAll = $('#btn-mark-all');
const btnClearCompleted = $('#btn-clear-completed');

// Edit modal
const editModal = $('#edit-modal');
const editForm = $('#edit-form');
const editId = $('#edit-id');
const editTitle = $('#edit-title');
const editDesc = $('#edit-description');
const editCategory = $('#edit-category');
const editDueDate = $('#edit-due-date');
const modalClose = $('#modal-close');
const btnCancelEdit = $('#btn-cancel-edit');

// Delete modal
const deleteModal = $('#delete-modal');
const deleteTitle = $('#delete-title');
const deleteModalClose = $('#delete-modal-close');
const btnCancelDelete = $('#btn-cancel-delete');
const btnConfirmDelete = $('#btn-confirm-delete');

// Toast
const toastContainer = $('#toast-container');

// Confetti
const confettiCanvas = $('#confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');

// ============================================
// Confetti Effect
// ============================================
let confettiPieces = [];
let confettiAnimating = false;

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function launchConfetti() {
  resizeConfetti();
  confettiPieces = [];

  const colors = ['#7c3aed', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#818cf8'];

  for (let i = 0; i < 100; i++) {
    confettiPieces.push({
      x: Math.random() * confettiCanvas.width,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      speedX: (Math.random() - 0.5) * 4,
      speedY: 2 + Math.random() * 4,
      opacity: 1,
    });
  }

  if (!confettiAnimating) {
    confettiAnimating = true;
    animateConfetti();
  }
}

function animateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  let alive = 0;
  confettiPieces.forEach((p) => {
    if (p.opacity <= 0) return;
    alive++;

    p.x += p.speedX;
    p.y += p.speedY;
    p.rotation += p.rotationSpeed;
    p.speedY += 0.1;

    if (p.y > confettiCanvas.height - 50) {
      p.opacity -= 0.02;
    }

    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rotation * Math.PI) / 180);
    confettiCtx.globalAlpha = Math.max(0, p.opacity);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    confettiCtx.restore();
  });

  if (alive > 0) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiAnimating = false;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

window.addEventListener('resize', resizeConfetti);

// ============================================
// Toast
// ============================================
function showToast(message, type = 'info') {
  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    info: 'fa-circle-info',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-removing');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// Custom Fetch Helper
// ============================================
async function authFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    logoutUser('Sesi telah habis, silakan masuk kembali');
  }
  
  return response;
}

// ============================================
// API
// ============================================
async function fetchTodos() {
  try {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);

    const url = params.toString() ? `${API_URL}?${params}` : API_URL;
    const res = await authFetch(url);
    const data = await res.json();

    if (data.success) {
      todos = data.data;
      stats = data.stats || stats;
      categories = data.categories || [];
      renderAll();
    } else {
      showToast('Gagal memuat data', 'error');
    }
  } catch (error) {
    console.error('Fetch error:', error);
    showToast('Gagal terhubung ke server', 'error');
  } finally {
    loadingEl.style.display = 'none';
  }
}

async function addTodo(todoData) {
  try {
    const res = await authFetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(todoData),
    });
    const data = await res.json();

    if (data.success) {
      await fetchTodos();
      showToast('Todo berhasil ditambahkan! 🎉', 'success');
    } else {
      showToast(data.message || 'Gagal menambahkan todo', 'error');
    }
  } catch (error) {
    console.error('Add error:', error);
    showToast('Gagal menambahkan todo', 'error');
  }
}

async function updateTodo(id, updates) {
  try {
    const res = await authFetch(`${API_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    const data = await res.json();

    if (data.success) {
      await fetchTodos();
      return true;
    } else {
      showToast(data.message || 'Gagal mengupdate todo', 'error');
      return false;
    }
  } catch (error) {
    console.error('Update error:', error);
    showToast('Gagal mengupdate todo', 'error');
    return false;
  }
}

async function deleteTodo(id) {
  try {
    // Animate removal first
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) {
      el.classList.add('removing');
      await sleep(350);
    }

    const res = await authFetch(`${API_URL}/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (data.success) {
      await fetchTodos();
      showToast('Todo berhasil dihapus', 'success');
    } else {
      showToast(data.message || 'Gagal menghapus todo', 'error');
    }
  } catch (error) {
    console.error('Delete error:', error);
    showToast('Gagal menghapus todo', 'error');
  }
}

async function bulkToggle(isCompleted) {
  try {
    const res = await authFetch(`${API_URL}/bulk/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isCompleted }),
    });
    const data = await res.json();

    if (data.success) {
      if (isCompleted) launchConfetti();
      await fetchTodos();
      showToast(data.message, 'success');
    }
  } catch (error) {
    console.error('Bulk toggle error:', error);
    showToast('Gagal mengupdate todos', 'error');
  }
}

async function clearCompleted() {
  try {
    const res = await authFetch(API_URL, { method: 'DELETE' });
    const data = await res.json();

    if (data.success) {
      await fetchTodos();
      showToast(data.message, 'success');
    }
  } catch (error) {
    console.error('Clear error:', error);
    showToast('Gagal menghapus todos', 'error');
  }
}

// ============================================
// Render
// ============================================
function renderAll() {
  renderStats();
  renderProgress();
  renderCategories();
  renderTodos();
  renderCategorySuggestions();
}

function renderStats() {
  animateNumber(statTotal, stats.total);
  animateNumber(statActive, stats.active);
  animateNumber(statCompleted, stats.completed);
  animateNumber(statOverdue, stats.overdue);
}

function animateNumber(el, target) {
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;

  const duration = 400;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(current + (target - current) * eased);

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function renderProgress() {
  const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  progressFill.style.width = pct + '%';
  progressPct.textContent = pct + '%';
}

function renderCategories() {
  const allCount = todos.length;
  let html = `
    <button class="category-item ${currentCategory === 'all' ? 'active' : ''}" data-category="all">
      <i class="fas fa-globe"></i>
      <span>Semua</span>
      <span class="category-count">${allCount}</span>
    </button>
  `;

  const catIcons = {
    'General': 'fa-folder',
    'Work': 'fa-briefcase',
    'Personal': 'fa-user',
    'Shopping': 'fa-cart-shopping',
    'Health': 'fa-heart-pulse',
    'Study': 'fa-graduation-cap',
    'Finance': 'fa-wallet',
  };

  categories.forEach((cat) => {
    const count = todos.filter((t) => t.category === cat).length;
    const icon = catIcons[cat] || 'fa-tag';
    html += `
      <button class="category-item ${currentCategory === cat ? 'active' : ''}" data-category="${escapeHtml(cat)}">
        <i class="fas ${icon}"></i>
        <span>${escapeHtml(cat)}</span>
        <span class="category-count">${count}</span>
      </button>
    `;
  });

  categoryList.innerHTML = html;

  // Re-bind category click events
  categoryList.querySelectorAll('.category-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.category;
      renderAll();
      // Close sidebar on mobile after selecting category
      if (window.innerWidth <= 900) {
        closeSidebar();
      }
    });
  });
}

function renderCategorySuggestions() {
  categorySuggestions.innerHTML = categories
    .map((c) => `<option value="${escapeHtml(c)}">`)
    .join('');
}

function getFilteredTodos() {
  return todos.filter((t) => {
    // Status filter
    if (currentFilter === 'active' && t.isCompleted) return false;
    if (currentFilter === 'completed' && !t.isCompleted) return false;

    // Priority filter
    if (currentPriority !== 'all' && t.priority !== currentPriority) return false;

    // Category filter
    if (currentCategory !== 'all' && t.category !== currentCategory) return false;

    return true;
  });
}

function renderTodos() {
  const filtered = getFilteredTodos();

  if (todos.length === 0) {
    todoList.innerHTML = '';
    emptyState.style.display = 'block';
    emptyState.querySelector('h3').textContent = 'Belum ada todo';
    emptyState.querySelector('p').innerHTML = 'Klik tombol <strong>+</strong> untuk menambahkan tugas pertamamu!';
    return;
  }

  if (filtered.length === 0) {
    todoList.innerHTML = '';
    emptyState.style.display = 'block';
    emptyState.querySelector('h3').textContent = 'Tidak ada hasil';
    emptyState.querySelector('p').textContent = 'Coba ubah filter atau kata kunci pencarian';
    return;
  }

  emptyState.style.display = 'none';

  todoList.innerHTML = filtered
    .map((todo, i) => {
      const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.isCompleted;
      const dueDateFormatted = todo.dueDate ? formatDateShort(todo.dueDate) : '';

      return `
        <div class="todo-item priority-${todo.priority} ${todo.isCompleted ? 'completed' : ''}"
             data-id="${todo._id}"
             style="animation-delay: ${i * 0.04}s">
          <div class="todo-checkbox">
            <input type="checkbox" id="check-${todo._id}"
                   ${todo.isCompleted ? 'checked' : ''}
                   onchange="handleToggle('${todo._id}', this.checked)">
            <label for="check-${todo._id}"></label>
          </div>
          <div class="todo-content">
            <div class="todo-title-row">
              <span class="todo-title">${escapeHtml(todo.title)}</span>
              <span class="todo-badge badge-${todo.priority}">${todo.priority}</span>
            </div>
            ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
            <div class="todo-meta">
              <span class="todo-meta-item">
                <i class="far fa-clock"></i> ${formatDate(todo.createdAt)}
              </span>
              ${todo.category ? `<span class="todo-meta-item todo-category"><i class="fas fa-folder"></i> ${escapeHtml(todo.category)}</span>` : ''}
              ${dueDateFormatted ? `<span class="todo-meta-item ${isOverdue ? 'todo-overdue' : ''}"><i class="fas ${isOverdue ? 'fa-exclamation-circle' : 'fa-calendar'}"></i> ${dueDateFormatted}</span>` : ''}
            </div>
          </div>
          <div class="todo-actions">
            <button class="btn-icon btn-edit" onclick="handleEdit('${todo._id}')" title="Edit">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn-icon btn-delete" onclick="handleDelete('${todo._id}')" title="Hapus">
              <i class="fas fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    })
    .join('');
}

// ============================================
// Helpers
// ============================================
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins}m lalu`;
  if (hours < 24) return `${hours}j lalu`;
  if (days < 7) return `${days}h lalu`;

  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diff = Math.floor((target - now) / 86400000);

  if (diff < 0) return `${Math.abs(diff)} hari terlambat`;
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Besok';
  if (diff < 7) return `${diff} hari lagi`;

  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

// ============================================
// Handlers
// ============================================
function handleToggle(id, checked) {
  updateTodo(id, { isCompleted: checked }).then((success) => {
    if (success) {
      if (checked) {
        launchConfetti();
        showToast('Tugas selesai! 🎉', 'success');
      } else {
        showToast('Tugas dibuka kembali', 'info');
      }
    }
  });
}

function handleEdit(id) {
  const todo = todos.find((t) => t._id === id);
  if (!todo) return;

  editId.value = todo._id;
  editTitle.value = todo.title;
  editDesc.value = todo.description || '';
  editCategory.value = todo.category || '';
  editDueDate.value = todo.dueDate ? todo.dueDate.substring(0, 10) : '';

  // Set priority
  const pRadio = document.querySelector(`input[name="edit-priority"][value="${todo.priority}"]`);
  if (pRadio) pRadio.checked = true;

  editModal.classList.add('active');
  setTimeout(() => editTitle.focus(), 300);
}

function handleDelete(id) {
  const todo = todos.find((t) => t._id === id);
  if (!todo) return;

  deleteTargetId = id;
  deleteTitle.textContent = todo.title;
  deleteModal.classList.add('active');
}

function closeModal(modal) {
  modal.classList.remove('active');
}

function toggleAddPanel() {
  const isOpen = addPanel.classList.contains('open');
  addPanel.classList.toggle('open');
  btnOpenForm.classList.toggle('active');

  if (!isOpen) {
    setTimeout(() => todoTitle.focus(), 400);
  }
}

function closeSidebar() {
  sidebar.classList.remove('open');
  const overlay = document.querySelector('.sidebar-overlay');
  if (overlay) overlay.classList.remove('active');
}

function toggleSidebar() {
  const isOpen = sidebar.classList.contains('open');

  if (isOpen) {
    closeSidebar();
    return;
  }

  sidebar.classList.add('open');

  // Create or get overlay — append inside .app-wrapper for correct stacking context
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.querySelector('.app-wrapper').appendChild(overlay);
    overlay.addEventListener('click', closeSidebar);
  }
  overlay.classList.add('active');
}

// ============================================
// Auth Logic
// ============================================

function setupAuthUI() {
  if (authToken) {
    authWrapper.style.display = 'none';
    appWrapper.style.display = 'flex';
    fetchTodos();
  } else {
    authWrapper.style.display = 'flex';
    appWrapper.style.display = 'none';
  }
}

function loginSuccess(token, user) {
  authToken = token;
  activeUser = user;
  localStorage.setItem('taskflow_token', token);
  showToast(`Selamat datang kembali, ${user.username}!`, 'success');
  
  // Clear forms
  loginEmail.value = '';
  loginPassword.value = '';
  regUsername.value = '';
  regEmail.value = '';
  regPassword.value = '';
  
  setupAuthUI();
}

function logoutUser(msg = 'Kamu berhasil keluar') {
  authToken = null;
  activeUser = null;
  localStorage.removeItem('taskflow_token');
  showToast(msg, 'info');
  setupAuthUI();
}

goToRegister.addEventListener('click', (e) => {
  e.preventDefault();
  loginFormWrapper.classList.remove('active');
  registerFormWrapper.classList.add('active');
  setTimeout(() => regUsername.focus(), 100);
});

goToLogin.addEventListener('click', (e) => {
  e.preventDefault();
  registerFormWrapper.classList.remove('active');
  loginFormWrapper.classList.add('active');
  setTimeout(() => loginEmail.focus(), 100);
});

loginFormWrapper.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  
  const originalHtml = loginFormWrapper.querySelector('button[type="submit"]').innerHTML;
  loginFormWrapper.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    
    if (data.success) {
      loginSuccess(data.data.token, data.data);
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Gagal terhubung ke server', 'error');
  } finally {
    loginFormWrapper.querySelector('button[type="submit"]').innerHTML = originalHtml;
  }
});

registerFormWrapper.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = regUsername.value.trim();
  const email = regEmail.value.trim();
  const password = regPassword.value;
  
  const originalHtml = registerFormWrapper.querySelector('button[type="submit"]').innerHTML;
  registerFormWrapper.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    
    if (data.success) {
      loginSuccess(data.data.token, data.data);
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Gagal terhubung ke server', 'error');
  } finally {
    registerFormWrapper.querySelector('button[type="submit"]').innerHTML = originalHtml;
  }
});

btnLogout.addEventListener('click', () => {
  logoutUser();
});

// ============================================
// Event Listeners
// ============================================

// Add form toggle
btnOpenForm.addEventListener('click', toggleAddPanel);
btnCancelForm.addEventListener('click', toggleAddPanel);

// Add form submit
todoForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = todoTitle.value.trim();
  if (!title) return;

  const priority = document.querySelector('input[name="priority"]:checked')?.value || 'medium';
  const category = todoCategory.value.trim() || 'General';
  const dueDate = todoDueDate.value || null;
  const description = todoDesc.value.trim();

  addTodo({ title, description, priority, category, dueDate });

  // Reset form
  todoForm.reset();
  document.getElementById('p-medium').checked = true;
  toggleAddPanel();
});

// Edit form submit
editForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const id = editId.value;
  const title = editTitle.value.trim();
  if (!title) {
    showToast('Title tidak boleh kosong', 'error');
    return;
  }

  const priority = document.querySelector('input[name="edit-priority"]:checked')?.value || 'medium';
  const category = editCategory.value.trim() || 'General';
  const dueDate = editDueDate.value || null;
  const description = editDesc.value.trim();

  updateTodo(id, { title, description, priority, category, dueDate }).then((success) => {
    if (success) {
      closeModal(editModal);
      showToast('Todo berhasil diupdate! ✏️', 'success');
    }
  });
});

// Delete confirm
btnConfirmDelete.addEventListener('click', () => {
  if (deleteTargetId) {
    deleteTodo(deleteTargetId);
    closeModal(deleteModal);
    deleteTargetId = null;
  }
});

// Modal close handlers
modalClose.addEventListener('click', () => closeModal(editModal));
btnCancelEdit.addEventListener('click', () => closeModal(editModal));
editModal.addEventListener('click', (e) => { if (e.target === editModal) closeModal(editModal); });

deleteModalClose.addEventListener('click', () => closeModal(deleteModal));
btnCancelDelete.addEventListener('click', () => closeModal(deleteModal));
deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) closeModal(deleteModal); });

// Escape closes modals & sidebar
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal(editModal);
    closeModal(deleteModal);
    closeSidebar();
  }
});

// Filter pills
filterPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    filterPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    currentFilter = pill.dataset.filter;
    renderTodos();
  });
});

// Priority pills
priorityPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    priorityPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    currentPriority = pill.dataset.priority;
    renderTodos();
  });
});

// Search
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  const val = e.target.value.trim();
  searchClear.style.display = val ? 'flex' : 'none';

  searchTimeout = setTimeout(() => {
    searchQuery = val;
    fetchTodos();
  }, 300);
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.style.display = 'none';
  searchQuery = '';
  fetchTodos();
});

// Sidebar
menuToggle.addEventListener('click', toggleSidebar);
sidebarClose.addEventListener('click', closeSidebar);

// Bulk actions
btnMarkAll.addEventListener('click', () => {
  if (stats.total === 0) return;
  const allDone = stats.completed === stats.total;
  bulkToggle(!allDone);
});

btnClearCompleted.addEventListener('click', () => {
  if (stats.completed === 0) {
    showToast('Tidak ada todo yang selesai', 'info');
    return;
  }
  clearCompleted();
});

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Try to load user if token exists
  if (authToken) {
    authFetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          activeUser = data.data;
          setupAuthUI();
        } else {
          logoutUser('Sesi kedaluwarsa');
        }
      })
      .catch(() => logoutUser('Kesalahan jaringan'));
  } else {
    setupAuthUI();
  }
});
