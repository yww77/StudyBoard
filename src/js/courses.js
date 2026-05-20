/**
 * courses.js — 课程 CRUD + UI 渲染
 */

// ===== 侧边栏课程列表 =====
function renderSidebarCourses() {
  const courses = getCourses();
  const list = document.getElementById('sidebarCourseList');

  if (courses.length === 0) {
    list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--warm-400);font-size:12px;">暂无课程<br/>点击下方按钮创建</div>';
    return;
  }

  list.innerHTML = courses.map(c => `
    <div class="sidebar-course-item ${AppState.currentCourseId === c.id ? 'active' : ''}"
         data-course-id="${c.id}">
      <span class="sidebar-course-dot" style="background:${c.color};"></span>
      <span class="sidebar-course-name">${escapeHtml(c.name)}</span>
    </div>
  `).join('');

  // 绑定点击事件
  list.querySelectorAll('.sidebar-course-item').forEach(item => {
    item.addEventListener('click', () => {
      AppState.currentCourseId = item.dataset.courseId;
      AppState.currentChapterId = null;
      renderSidebarCourses();
      switchTab('courses');
    });
  });
}

// ===== 主内容区：课程视图 =====
function renderCourseView() {
  const content = document.getElementById('content');
  const courses = getCourses();

  // 如果选中了某门课程，显示课程详情（章节列表）
  if (AppState.currentCourseId) {
    const course = getCourseById(AppState.currentCourseId);
    if (course) {
      renderChapterView(course);
      return;
    }
  }

  // 否则显示课程网格
  if (courses.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <p>还没有创建任何课程</p>
        <button class="btn btn-primary" id="btnNewCourseEmpty">+ 创建第一门课程</button>
      </div>`;
    document.getElementById('btnNewCourseEmpty').addEventListener('click', showNewCourseModal);
    return;
  }

  content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <h2 style="font-size:18px;font-weight:700;color:var(--warm-700);">我的课程</h2>
      <button class="btn btn-primary" id="btnNewCourseTop">+ 新建课程</button>
    </div>
    <div class="course-grid" id="courseGrid">
      ${courses.map(c => `
        <div class="card course-card" data-course-id="${c.id}" style="border-left-color:${c.color};">
          <div class="card-header">
            <span class="card-title">${escapeHtml(c.name)}</span>
            <div style="display:flex;gap:4px;">
              <button class="btn-icon btn-rename-course" data-course-id="${c.id}" title="重命名">✏️</button>
              <button class="btn-icon btn-delete-course" data-course-id="${c.id}" title="删除">🗑️</button>
            </div>
          </div>
          <div class="course-meta">
            ${(c.chapters || []).length} 个章节 · 创建于 ${c.createdAt || '未知'}
          </div>
        </div>
      `).join('')}
    </div>`;

  // 绑定事件
  document.getElementById('btnNewCourseTop').addEventListener('click', showNewCourseModal);

  // 课程卡片点击 → 进入课程
  document.querySelectorAll('.course-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return; // 不拦截按钮点击
      AppState.currentCourseId = card.dataset.courseId;
      AppState.currentChapterId = null;
      renderSidebarCourses();
      renderCourseView();
    });
  });

  // 删除按钮
  document.querySelectorAll('.btn-delete-course').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const courseId = btn.dataset.courseId;
      const course = getCourseById(courseId);
      if (confirm(`确定删除课程「${course.name}」吗？\n该课程的章节、概念及关联例题将一并删除，此操作不可恢复。`)) {
        deleteCourse(courseId);
        if (AppState.currentCourseId === courseId) {
          AppState.currentCourseId = null;
          AppState.currentChapterId = null;
        }
        renderSidebarCourses();
        renderCourseView();
        showToast('课程已删除', 'success');
      }
    });
  });

  // 重命名按钮
  document.querySelectorAll('.btn-rename-course').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const courseId = btn.dataset.courseId;
      const course = getCourseById(courseId);
      showRenameCourseModal(course);
    });
  });
}

// ===== 新建课程弹窗 =====
function showNewCourseModal() {
  const colors = ['#8a9b9e', '#c4958b', '#9bae8c', '#c4b998', '#a0988e', '#b59a8c', '#8a9b8c', '#9b8a8e'];
  const bodyHtml = `
    <div class="form-group">
      <label>课程名称</label>
      <input class="form-input" id="newCourseName" placeholder="例如：高等数学" autofocus>
    </div>
    <div class="form-group">
      <label>标签颜色</label>
      <div class="color-options" id="colorOptions">
        ${colors.map((c, i) => `
          <span class="color-option ${i === 0 ? 'selected' : ''}"
                data-color="${c}" style="background:${c};"></span>
        `).join('')}
      </div>
      <input type="hidden" id="newCourseColor" value="${colors[0]}">
    </div>`;

  showModal('新建课程', bodyHtml, (overlay) => {
    const name = overlay.querySelector('#newCourseName').value.trim();
    if (!name) {
      showToast('请输入课程名称', 'error');
      return;
    }
    const color = overlay.querySelector('#newCourseColor').value;

    const course = {
      id: generateId(),
      name: name,
      color: color,
      createdAt: todayStr(),
      chapters: [],
      mindmapConnections: [],
      mindmapNodePositions: {},
    };

    addCourse(course);
    overlay.remove();
    renderSidebarCourses();
    renderCourseView();
    showToast('课程创建成功', 'success');
  });

  // 颜色选择交互
  setTimeout(() => {
    const opts = document.querySelectorAll('#colorOptions .color-option');
    opts.forEach(opt => {
      opt.addEventListener('click', () => {
        opts.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        document.getElementById('newCourseColor').value = opt.dataset.color;
      });
    });
  }, 50);
}

// ===== 重命名课程弹窗 =====
function showRenameCourseModal(course) {
  const bodyHtml = `
    <div class="form-group">
      <label>课程名称</label>
      <input class="form-input" id="renameCourseName" value="${escapeHtml(course.name)}" autofocus>
    </div>`;

  showModal('重命名课程', bodyHtml, (overlay) => {
    const name = overlay.querySelector('#renameCourseName').value.trim();
    if (!name) {
      showToast('课程名称不能为空', 'error');
      return;
    }
    updateCourse(course.id, { name });
    overlay.remove();
    renderSidebarCourses();
    renderCourseView();
    showToast('课程已重命名', 'success');
  });
}

// renderChapterView 由 chapters.js 提供
