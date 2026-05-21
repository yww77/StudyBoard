/**
 * 工具函数 — UUID 生成、日期格式化、防抖、DOM 操作
 */

// 生成唯一 ID（短格式，足够本地使用）
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// 获取当前日期字符串 YYYY-MM-DD
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

// 计算距目标日期的剩余天数（纯函数）
// dateStr: YYYY-MM-DD，返回整数天数（负数=已过期），无效输入返回 null
function calcDaysUntil(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// 防抖函数
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ===== KaTeX 安全渲染（公共函数） =====

// 安全渲染 LaTeX 到 DOM 元素（原地设置 innerHTML）
// latex: LaTeX 源码字符串
// target: DOM 元素
// displayMode: true = 块级公式（居中）, false = 行内公式
function safeRenderKatex(latex, target, displayMode = true) {
  if (!target) return;
  if (typeof katex === 'undefined') {
    target.innerHTML = '<span style="color:#f59e0b;font-size:12px;">⚠ KaTeX 未加载，请检查网络后刷新页面</span>';
    return;
  }
  if (!latex || !latex.trim()) {
    target.innerHTML = '';
    return;
  }
  try {
    katex.render(latex.trim(), target, { throwOnError: false, displayMode });
  } catch (e) {
    target.innerHTML = '<span style="color:var(--red);font-size:12px;">公式语法错误：请检查 LaTeX 代码</span>';
  }
}

// 安全渲染 LaTeX 为 HTML 字符串
// 成功返回 HTML 字符串，失败返回 null（调用方自行处理回退）
// displayMode: true = 块级公式, false = 行内公式
function safeRenderKatexToString(latex, displayMode = true) {
  if (typeof katex === 'undefined') return null;
  if (!latex || !latex.trim()) return '';
  try {
    return katex.renderToString(latex.trim(), { throwOnError: false, displayMode });
  } catch (e) {
    return null;
  }
}

// 转义 HTML 特殊字符，防止 XSS
function escapeHtml(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return String(str).replace(/[&<>"']/g, c => map[c]);
}

// 创建 DOM 元素（简化写法）
function el(tag, attrs = {}, ...children) {
  const elem = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'className') {
      elem.className = val;
    } else if (key === 'dataset') {
      Object.assign(elem.dataset, val);
    } else if (key.startsWith('on')) {
      elem.addEventListener(key.slice(2).toLowerCase(), val);
    } else {
      elem.setAttribute(key, val);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      elem.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      elem.appendChild(child);
    }
  }
  return elem;
}

// 显示 Toast 提示
function showToast(message, type = 'info') {
  const toast = el('div', { className: `toast toast-${type}` }, message);
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-visible'));
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}
