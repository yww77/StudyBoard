/**
 * courses.js — 课程 CRUD + UI 渲染
 */

// ===== 侧边栏课程列表 =====
function renderSidebarCourses() {
  const courses = getCourses();
  const list = document.getElementById('sidebarCourseList');

  if (courses.length === 0) {
    list.innerHTML = '<div class="text-muted" style="padding:16px;text-align:center;">暂无课程<br/>点击下方按钮创建</div>';
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
        <div class="empty-icon"><i data-lucide="book-marked"></i></div>
        <p>还没有创建任何课程</p>
        <button class="btn btn-primary" id="btnNewCourseEmpty"><i data-lucide="plus"></i> 创建第一门课程</button>
      </div>`;
    document.getElementById('btnNewCourseEmpty').addEventListener('click', showNewCourseModal);
    return;
  }

  content.innerHTML = `
    <div class="flex-between" style="margin-bottom:20px;">
      <h2 style="font-size:18px;font-weight:700;color:var(--ink);">我的课程</h2>
      <button class="btn btn-primary" id="btnNewCourseTop"><i data-lucide="plus"></i> 新建课程</button>
    </div>
    <div class="course-grid" id="courseGrid">
      ${courses.map(c => `
        <div class="card course-card" data-course-id="${c.id}" style="border-left-color:${c.color};">
          <div class="card-header">
            <span class="card-title">${escapeHtml(c.name)}</span>
            <div style="display:flex;gap:4px;">
              <button class="btn-icon btn-edit-course-info" data-course-id="${c.id}" title="编辑课程信息"><i data-lucide="info"></i></button>
              <button class="btn-icon btn-rename-course" data-course-id="${c.id}" title="重命名"><i data-lucide="pencil"></i></button>
              <button class="btn-icon btn-delete-course" data-course-id="${c.id}" title="删除"><i data-lucide="trash-2"></i></button>
            </div>
          </div>
          <div class="course-meta">
            ${(c.chapters || []).length} 个章节 · 创建于 ${c.createdAt || '未知'}
          </div>
          ${renderCourseInfoBar(c)}
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

  // 编辑课程信息按钮
  document.querySelectorAll('.btn-edit-course-info').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const courseId = btn.dataset.courseId;
      const course = getCourseById(courseId);
      if (course) showEditCourseInfoModal(course);
    });
  });

  // 课程信息空状态占位点击
  document.querySelectorAll('.course-info-empty').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const courseId = el.dataset.courseId;
      const course = getCourseById(courseId);
      if (course) showEditCourseInfoModal(course);
    });
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
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
  }, (overlay) => {
    const opts = overlay.querySelectorAll('#colorOptions .color-option');
    opts.forEach(opt => {
      opt.addEventListener('click', () => {
        opts.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        document.getElementById('newCourseColor').value = opt.dataset.color;
      });
    });
  });
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

// ===== 课程信息栏渲染（纯函数） =====
function renderCourseInfoBar(course) {
  const info = course.courseInfo || {};
  const bonustests = Array.isArray(info.bonustests) ? info.bonustests : [];
  const hasAny = info.credits || info.examDate || info.examTime ||
                 info.examLocation || info.examHilfsmittel || bonustests.length > 0;

  if (!hasAny) {
    return `<div class="course-info-empty" data-course-id="${course.id}" data-action="edit-info">
      <i data-lucide="info"></i> 点击添加课程信息...
    </div>`;
  }

  let html = '<div class="course-info-block">';

  if (info.credits) {
    html += `<div class="course-info-row">
      <i data-lucide="graduation-cap"></i> ${escapeHtml(String(info.credits))} 学分
    </div>`;
  }

  if (info.examDate) {
    const days = calcDaysUntil(info.examDate);
    let cls = 'normal', label = '';
    if (days !== null) {
      if (days < 0) { cls = 'urgent'; label = '已结束'; }
      else if (days <= 7) { cls = 'urgent'; label = `剩 ${days} 天`; }
      else if (days <= 30) { cls = 'warning'; label = `剩 ${days} 天`; }
      else { cls = 'normal'; label = `剩 ${days} 天`; }
    }
    html += `<div class="course-info-row">
      <i data-lucide="calendar-days"></i> ${escapeHtml(info.examDate)}
      ${info.examTime ? ' ' + escapeHtml(info.examTime) : ''}
      ${label ? `<span class="course-countdown ${cls}"><i data-lucide="clock"></i> ${label}</span>` : ''}
    </div>`;
  }

  if (info.examLocation) {
    html += `<div class="course-info-row">
      <i data-lucide="map-pin"></i> ${escapeHtml(info.examLocation)}
    </div>`;
  }

  if (info.examHilfsmittel) {
    html += `<div class="course-info-row">
      <i data-lucide="paperclip"></i> 考试: ${escapeHtml(info.examHilfsmittel)}
    </div>`;
  }

  if (bonustests.length > 0) {
    bonustests.forEach((bt, i) => {
      let parts = [];
      if (bt.points) parts.push(`${escapeHtml(String(bt.points))} 分`);
      if (bt.date) parts.push(escapeHtml(bt.date));
      html += `<div class="course-info-row">
        <span class="course-bonus-badge"><i data-lucide="gift"></i> Bonustest${bonustests.length > 1 ? ' ' + (i + 1) : ''}${parts.length ? ': ' + parts.join(' · ') : ''}</span>
        ${bt.hilfsmittel ? '<span style="margin-left:4px;font-size:12px;color:var(--ink-muted);">' + escapeHtml(bt.hilfsmittel) + '</span>' : ''}
      </div>`;
    });
  }

  html += '</div>';
  return html;
}

// ===== 编辑课程信息弹窗 =====
function showEditCourseInfoModal(course) {
  const info = course.courseInfo || {};

  const bodyHtml = `
    <div class="form-group">
      <label>学分 (ECTS)</label>
      <input class="form-input" id="infoCredits" value="${escapeHtml(info.credits || '')}" placeholder="例如：6">
    </div>
    <div class="form-group">
      <label>考试日期</label>
      <input class="form-input" type="date" id="infoExamDate" value="${escapeHtml(info.examDate || '')}">
    </div>
    <div class="form-group">
      <label>考试时间</label>
      <input class="form-input" id="infoExamTime" value="${escapeHtml(info.examTime || '')}" placeholder="例如：14:00-16:00">
    </div>
    <div class="form-group">
      <label>考试地点</label>
      <input class="form-input" id="infoExamLocation" value="${escapeHtml(info.examLocation || '')}" placeholder="例如：Hörsaal H01">
    </div>
    <div class="form-group">
      <label>考试 Hilfsmittel（允许的辅助工具）</label>
      <textarea class="form-input form-textarea" id="infoExamHilfsmittel" rows="2" placeholder="例如：Taschenrechner (nicht programmierbar), Formelsammlung">${escapeHtml(info.examHilfsmittel || '')}</textarea>
    </div>
    <div class="form-group" style="border-top:2px solid var(--paper-border);padding-top:14px;">
      <label style="display:flex;align-items:center;justify-content:space-between;">
        <span>Bonustests</span>
        <button type="button" class="btn btn-sm btn-secondary" id="btnAddBonustest" style="font-size:11px;padding:4px 10px;"><i data-lucide="plus"></i> 添加</button>
      </label>
      <div id="bonustestList">
        ${(info.bonustests || []).map((bt, i) => `
          <div class="bonustest-entry" data-index="${i}" style="padding:10px 0;border-bottom:1px solid var(--paper-border);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:12px;font-weight:700;color:var(--ink-light);">Bonustest ${i + 1}</span>
              <button type="button" class="btn-icon btn-remove-bonustest" data-index="${i}" title="删除" style="width:26px;height:26px;"><i data-lucide="x" style="width:14px;height:14px;"></i></button>
            </div>
            <div style="display:flex;gap:8px;margin-bottom:6px;">
              <input class="form-input" type="date" id="btDate${i}" value="${escapeHtml(bt.date || '')}" style="flex:1;">
              <input class="form-input" id="btPoints${i}" value="${escapeHtml(bt.points || '')}" placeholder="分数 如0.3" style="flex:1;">
            </div>
            <textarea class="form-input form-textarea" id="btHilfsmittel${i}" rows="2" placeholder="Hilfsmittel（可选）" style="width:100%;">${escapeHtml(bt.hilfsmittel || '')}</textarea>
          </div>
        `).join('')}
        ${(info.bonustests || []).length === 0 ? '<div class="text-muted" id="bonustestEmpty" style="text-align:center;padding:12px;">暂无 Bonustest，点击「添加」新增</div>' : ''}
      </div>
    </div>`;

  showModal('编辑课程信息', bodyHtml, (overlay) => {
    const newInfo = {
      credits: overlay.querySelector('#infoCredits').value.trim(),
      examDate: overlay.querySelector('#infoExamDate').value,
      examTime: overlay.querySelector('#infoExamTime').value.trim(),
      examLocation: overlay.querySelector('#infoExamLocation').value.trim(),
      examHilfsmittel: overlay.querySelector('#infoExamHilfsmittel').value.trim(),
      bonustests: []
    };

    // 收集所有 Bonustest 条目
    const entries = overlay.querySelectorAll('.bonustest-entry');
    entries.forEach(entry => {
      const idx = entry.dataset.index;
      newInfo.bonustests.push({
        date: overlay.querySelector(`#btDate${idx}`).value,
        points: overlay.querySelector(`#btPoints${idx}`).value.trim(),
        hilfsmittel: overlay.querySelector(`#btHilfsmittel${idx}`).value.trim()
      });
    });

    updateCourse(course.id, { courseInfo: newInfo });
    overlay.remove();
    renderCourseView();
    showToast('课程信息已更新', 'success');
  }, (overlay) => {
    let nextIdx = (info.bonustests || []).length;
    const list = overlay.querySelector('#bonustestList');
    const emptyMsg = overlay.querySelector('#bonustestEmpty');

    function refreshIcons() { if (typeof lucide !== 'undefined') lucide.createIcons(); }

    function addEntry() {
      if (emptyMsg) emptyMsg.remove();
      const idx = nextIdx++;
      const entry = document.createElement('div');
      entry.className = 'bonustest-entry';
      entry.dataset.index = idx;
      entry.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:12px;font-weight:700;color:var(--ink-light);">Bonustest ${list.children.length + 1}</span>
          <button type="button" class="btn-icon btn-remove-bonustest" data-index="${idx}" title="删除" style="width:26px;height:26px;"><i data-lucide="x" style="width:14px;height:14px;"></i></button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:6px;">
          <input class="form-input" type="date" id="btDate${idx}" style="flex:1;">
          <input class="form-input" id="btPoints${idx}" placeholder="分数 如0.3" style="flex:1;">
        </div>
        <textarea class="form-input form-textarea" id="btHilfsmittel${idx}" rows="2" placeholder="Hilfsmittel（可选）" style="width:100%;"></textarea>
      `;
      list.appendChild(entry);
      bindRemove(entry.querySelector('.btn-remove-bonustest'));
      renumber();
      refreshIcons();
    }

    function bindRemove(btn) {
      btn.addEventListener('click', () => {
        btn.closest('.bonustest-entry').remove();
        renumber();
        if (list.querySelectorAll('.bonustest-entry').length === 0 && !overlay.querySelector('#bonustestEmpty')) {
          const msg = document.createElement('div');
          msg.className = 'text-muted';
          msg.id = 'bonustestEmpty';
          msg.style.cssText = 'text-align:center;padding:12px;';
          msg.textContent = '暂无 Bonustest，点击「添加」新增';
          list.appendChild(msg);
        }
      });
    }

    function renumber() {
      const entries = list.querySelectorAll('.bonustest-entry');
      entries.forEach((entry, i) => {
        const label = entry.querySelector('span');
        if (label) label.textContent = `Bonustest ${i + 1}`;
      });
    }

    overlay.querySelector('#btnAddBonustest').addEventListener('click', addEntry);
    overlay.querySelectorAll('.btn-remove-bonustest').forEach(bindRemove);
    refreshIcons();
  });
}

// renderChapterView 由 chapters.js 提供
