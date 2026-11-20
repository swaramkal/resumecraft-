export function escapeHTML(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  const dot = type === 'error' ? '#f43f5e' : type === 'success' ? '#10b981' : '#6366f1';
  toast.innerHTML = `<span style="width:9px;height:9px;border-radius:50%;background:${dot};display:inline-block;"></span><span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.25s';
    setTimeout(() => toast.remove(), 260);
  }, 3000);
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
