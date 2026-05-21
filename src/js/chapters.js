/**
 * chapters.js — 章节 CRUD + UI 渲染 + 排序
 */

// ===== 新建章节弹窗 =====
function showNewChapterModal(course) {
  const bodyHtml = `
    <div class="form-group">
      <label>章节名称</label>
      <input class="form-input" id="newChapterTitle" placeholder="例如：第一章 极限与连续" autofocus>
    </div>`;

  showModal('新建章节 — ' + course.name, bodyHtml, (overlay) => {
    const title = overlay.querySelector('#newChapterTitle').value.trim();
    if (!title) {
      showToast('请输入章节名称', 'error');
      return;
    }

    const chapter = {
      id: generateId(),
      title: title,
      order: (course.chapters || []).length,
      concepts: [],
    };

    if (!course.chapters) course.chapters = [];
    course.chapters.push(chapter);
    updateCourse(course.id, { chapters: course.chapters });
    overlay.remove();
    renderChapterView(course);
    showToast('章节创建成功', 'success');
  });
}

// ===== 渲染章节视图 =====
function renderChapterView(course) {
  const content = document.getElementById('content');
  const chapters = course.chapters || [];

  // 按 order 排序
  chapters.sort((a, b) => a.order - b.order);

  let chaptersHtml = '';
  if (chapters.length === 0) {
    chaptersHtml = `
      <div class="empty-state">
        <div class="empty-icon"><i data-lucide="book-open"></i></div>
        <p>暂无章节，开始构建知识框架吧</p>
      </div>`;
  } else {
    chaptersHtml = `<div id="chapterList">` + chapters.map((ch, i) => `
      <div class="card chapter-card" style="margin-bottom:8px;" data-chapter-id="${ch.id}">
        <div class="card-header">
          <div class="flex-center gap-sm">
            <span style="color:var(--ink-muted);font-size:14px;font-weight:600;">Ch ${i + 1}</span>
            <span class="card-title">${escapeHtml(ch.title)}</span>
            <span class="text-muted">${(ch.concepts || []).length} 个概念</span>
          </div>
          <div class="flex-center gap-xs">
            <button class="btn-icon btn-move-up" data-chapter-id="${ch.id}" title="上移" ${i === 0 ? 'disabled style="opacity:0.3"' : ''}><i data-lucide="chevron-up"></i></button>
            <button class="btn-icon btn-move-down" data-chapter-id="${ch.id}" title="下移" ${i === chapters.length - 1 ? 'disabled style="opacity:0.3"' : ''}><i data-lucide="chevron-down"></i></button>
            <button class="btn-icon btn-rename-chapter" data-chapter-id="${ch.id}" title="重命名"><i data-lucide="pencil"></i></button>
            <button class="btn-icon btn-delete-chapter" data-chapter-id="${ch.id}" title="删除"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
        <!-- 概念列表占位（阶段 4 填充） -->
        <div class="chapter-concepts" data-chapter-id="${ch.id}" style="margin-top:8px;padding-left:18px;">
          ${renderConceptsInChapter(ch)}
        </div>
      </div>
    `).join('') + `</div>`;
  }

  content.innerHTML = `
    <div class="breadcrumb">
      <span id="breadCourses"><i data-lucide="book-marked"></i> 课程列表</span>
      <span class="sep">›</span>
      <span style="color:var(--ink);font-weight:500;">${escapeHtml(course.name)}</span>
    </div>
    <div class="flex-between" style="margin-bottom:16px;">
      <h2 style="font-size:18px;font-weight:700;color:var(--ink);">${escapeHtml(course.name)} — 章节</h2>
      <button class="btn btn-primary" id="btnNewChapterTop"><i data-lucide="plus"></i> 新建章节</button>
    </div>
    ${chaptersHtml}
    <div style="margin-top:24px;display:flex;gap:8px;">
      <button class="btn btn-secondary btn-sm" id="btnQuickExample"><i data-lucide="file-text"></i> 添加例题</button>
      <button class="btn btn-secondary btn-sm" id="btnQuickMindmap"><i data-lucide="git-graph"></i> 查看思维导图</button>
    </div>`;

  // 面包屑
  content.querySelector('#breadCourses').addEventListener('click', () => {
    AppState.currentCourseId = null;
    AppState.currentChapterId = null;
    renderSidebarCourses();
    renderCourseView();
  });

  // 新建章节
  content.querySelector('#btnNewChapterTop').addEventListener('click', () => {
    showNewChapterModal(course);
  });

  // 删除章节
  content.querySelectorAll('.btn-delete-chapter').forEach(btn => {
    btn.addEventListener('click', () => {
      const chId = btn.dataset.chapterId;
      const ch = chapters.find(c => c.id === chId);
      if (ch && confirm(`确定删除章节「${ch.title}」吗？其下所有概念将被删除。`)) {
        course.chapters = course.chapters.filter(c => c.id !== chId);
        // 重新排序
        course.chapters.forEach((c, idx) => { c.order = idx; });
        updateCourse(course.id, { chapters: course.chapters });
        renderChapterView(course);
        showToast('章节已删除', 'success');
      }
    });
  });

  // 重命名章节
  content.querySelectorAll('.btn-rename-chapter').forEach(btn => {
    btn.addEventListener('click', () => {
      const chId = btn.dataset.chapterId;
      const ch = chapters.find(c => c.id === chId);
      if (!ch) return;
      showRenameChapterModal(course, ch);
    });
  });

  // 上移
  content.querySelectorAll('.btn-move-up').forEach(btn => {
    btn.addEventListener('click', () => {
      const chId = btn.dataset.chapterId;
      const idx = chapters.findIndex(c => c.id === chId);
      if (idx > 0) {
        [chapters[idx].order, chapters[idx - 1].order] = [chapters[idx - 1].order, chapters[idx].order];
        updateCourse(course.id, { chapters: chapters });
        renderChapterView(course);
      }
    });
  });

  // 下移
  content.querySelectorAll('.btn-move-down').forEach(btn => {
    btn.addEventListener('click', () => {
      const chId = btn.dataset.chapterId;
      const idx = chapters.findIndex(c => c.id === chId);
      if (idx < chapters.length - 1) {
        [chapters[idx].order, chapters[idx + 1].order] = [chapters[idx + 1].order, chapters[idx].order];
        updateCourse(course.id, { chapters: chapters });
        renderChapterView(course);
      }
    });
  });

  // 绑定概念卡片事件
  bindConceptCardEvents(content);

  // 快速操作
  content.querySelector('#btnQuickExample').addEventListener('click', () => switchTab('examples'));
  content.querySelector('#btnQuickMindmap').addEventListener('click', () => switchTab('mindmap'));

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ===== 重命名章节弹窗 =====
function showRenameChapterModal(course, chapter) {
  const bodyHtml = `
    <div class="form-group">
      <label>章节名称</label>
      <input class="form-input" id="renameChapterTitle" value="${escapeHtml(chapter.title)}" autofocus>
    </div>`;

  showModal('重命名章节', bodyHtml, (overlay) => {
    const title = overlay.querySelector('#renameChapterTitle').value.trim();
    if (!title) {
      showToast('章节名称不能为空', 'error');
      return;
    }
    chapter.title = title;
    // 找到课程中对应章节并更新
    const idx = course.chapters.findIndex(c => c.id === chapter.id);
    if (idx !== -1) {
      course.chapters[idx].title = title;
      updateCourse(course.id, { chapters: course.chapters });
    }
    overlay.remove();
    renderChapterView(course);
    showToast('章节已重命名', 'success');
  });
}

// renderConceptsInChapter 和 showNewConceptModal 由 concepts.js 提供
