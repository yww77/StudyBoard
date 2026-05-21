/**
 * app.js — 应用入口、全局状态、标签页路由
 */

// ===== 全局状态 =====
const AppState = {
  currentTab: 'courses',        // courses | examples | mindmap | latexRef
  currentCourseId: null,        // 当前选中课程
  currentChapterId: null,       // 当前选中章节
};

// ===== DOM 引用缓存 =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DOM = {
  content:     $('#content'),
  sidebarList: $('#sidebarCourseList'),
  topbar:      $('#topbar'),
  modalContainer: $('#modalContainer'),
};

// ===== 标签页路由 =====
function switchTab(tabName) {
  AppState.currentTab = tabName;

  // 更新标签样式
  $$('.topbar-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // 路由到对应渲染函数
  switch (tabName) {
    case 'courses':
      if (typeof renderCourseView === 'function') renderCourseView();
      else DOM.content.innerHTML = '<div class="empty-state"><div class="empty-icon"><i data-lucide="book-marked"></i></div><p>课程模块加载中...</p></div>';
      break;
    case 'examples':
      if (typeof renderExampleView === 'function') renderExampleView();
      else DOM.content.innerHTML = '<div class="empty-state"><div class="empty-icon"><i data-lucide="file-text"></i></div><p>例题模块加载中...</p></div>';
      break;
    case 'mindmap':
      if (typeof renderMindmapView === 'function') renderMindmapView();
      else DOM.content.innerHTML = '<div class="empty-state"><div class="empty-icon"><i data-lucide="git-graph"></i></div><p>思维导图模块加载中...</p></div>';
      break;
    case 'latexRef':
      if (typeof renderLatexRefView === 'function') renderLatexRefView();
      else DOM.content.innerHTML = '<div class="empty-state"><div class="empty-icon"><i data-lucide="library"></i></div><p>公式参考模块加载中...</p></div>';
      break;
  }
}

// ===== 弹窗管理 =====
function showModal(title, bodyHtml, onSave, onReady) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>${title}</h3>
      <div class="modal-body">${bodyHtml}</div>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="modalCancel">取消</button>
        <button class="btn btn-primary" id="modalSave">确认</button>
      </div>
    </div>
  `;
  DOM.modalContainer.appendChild(overlay);

  // DOM 插入后立即通知调用方（替代 setTimeout 硬编码延迟）
  if (onReady) onReady(overlay);

  if (typeof lucide !== 'undefined') lucide.createIcons();

  overlay.querySelector('#modalCancel').addEventListener('click', closeModal);
  overlay.querySelector('#modalSave').addEventListener('click', () => {
    if (onSave) onSave(overlay);
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  function closeModal() {
    overlay.remove();
  }
  return { close: closeModal };
}

function closeAllModals() {
  DOM.modalContainer.innerHTML = '';
}

// ===== 侧边栏课程列表刷新 =====
function refreshSidebarCourses() {
  if (typeof renderSidebarCourses === 'function') {
    renderSidebarCourses();
  }
}

// ===== 事件绑定 =====
function bindEvents() {
  // 顶部标签切换
  $$('.topbar-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // 新建课程按钮
  $('#btnNewCourse').addEventListener('click', () => {
    if (typeof showNewCourseModal === 'function') showNewCourseModal();
  });

  // 导出/导入按钮
  $('#btnExport').addEventListener('click', () => {
    if (typeof exportData === 'function') exportData();
    else showToast('导出功能将在阶段 8 实现', 'info');
  });

  $('#btnImport').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });

  document.getElementById('importFileInput').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      if (typeof importData === 'function') importData(e.target.files[0]);
      else showToast('导入功能将在阶段 8 实现', 'info');
      e.target.value = '';
    }
  });

  // 清空数据按钮
  $('#btnClearData').addEventListener('click', () => {
    if (confirm('确定清空所有数据吗？\n\n这将删除所有课程、章节、概念、例题和思维导图。\n此操作不可撤销！\n\n建议先导出备份。')) {
      if (confirm('再次确认：真的要清空全部数据吗？')) {
        if (typeof clearAllData === 'function') {
          clearAllData();
          refreshSidebarCourses();
          switchTab('courses');
        } else {
          showToast('清空功能暂不可用', 'error');
        }
      }
    }
  });

  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
}

// ===== 初始化 =====
function init() {
  bindEvents();
  // 初始化存储
  if (typeof initStorage === 'function') initStorage();
  // 渲染侧边栏
  refreshSidebarCourses();
  // 默认显示课程视图
  switchTab('courses');
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);
