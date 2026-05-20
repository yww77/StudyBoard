/**
 * examples.js — 例题独立模块 + tag 标签 + 图片上传 + 搜索
 */

// 当前搜索关键词
let exampleSearchQuery = '';
let exampleFilterCourseId = null;

// ===== 例题主视图 =====
function renderExampleView() {
  const content = document.getElementById('content');
  const courses = getCourses();
  const allExamples = getExamples();

  // 筛选
  let examples = allExamples;
  if (exampleFilterCourseId) {
    examples = examples.filter(e => e.courseId === exampleFilterCourseId);
  }
  if (exampleSearchQuery.trim()) {
    const q = exampleSearchQuery.trim().toLowerCase();
    examples = examples.filter(e => {
      const titleMatch = (e.title || '').toLowerCase().includes(q);
      const contentMatch = (e.content || '').toLowerCase().includes(q);
      const tagList = Array.isArray(e.tags) ? e.tags : [];
      // Tag 精确匹配（不是子串匹配）
      const tagMatch = tagList.some(t => (t || '').toLowerCase() === q);
      return titleMatch || contentMatch || tagMatch;
    });
  }

  content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <h2 style="font-size:18px;font-weight:700;color:var(--warm-700);">📝 例题库</h2>
      <button class="btn btn-primary" id="btnNewExample">+ 新建例题</button>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
      <div class="search-bar" style="flex:1;min-width:200px;margin-bottom:0;">
        <input type="text" id="exampleSearch" placeholder="搜索标题、Tag（tag 精确匹配）..." value="${escapeHtml(exampleSearchQuery)}" autocomplete="off">
      </div>
      <select class="form-input" id="exampleCourseFilter" style="width:180px;">
        <option value="">📚 全部课程</option>
        ${courses.map(c => `
          <option value="${c.id}" ${exampleFilterCourseId === c.id ? 'selected' : ''}>
            ${escapeHtml(c.name)}
          </option>
        `).join('')}
      </select>
    </div>

    <div id="exampleResults">
      ${examples.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <p>${allExamples.length === 0 ? '还没有任何例题，点击上方按钮添加' : '没有匹配的例题'}</p>
        </div>` : `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;" id="exampleGrid">
          ${examples.map(example => renderExampleCard(example)).join('')}
        </div>`
      }
    </div>`;

  // 事件绑定
  document.getElementById('btnNewExample').addEventListener('click', () => showExampleModal());

  document.getElementById('exampleSearch').addEventListener('input', debounce((e) => {
    exampleSearchQuery = e.target.value;
    refreshExampleResults();
  }, 300));

  document.getElementById('exampleCourseFilter').addEventListener('change', (e) => {
    exampleFilterCourseId = e.target.value || null;
    exampleSearchQuery = '';
    document.getElementById('exampleSearch').value = '';
    refreshExampleResults();
  });

  bindExampleCardEvents();
}

// ===== 例题卡片 =====
function renderExampleCard(example) {
  const course = getCourseById(example.courseId);
  const fileCount = (example.images || []).length + (example.pdfs || []).length;
  const fileHint = fileCount > 0 ? `<span style="font-size:11px;color:var(--warm-400);">📎 ${fileCount} 个附件</span>` : '';

  const imagesHtml = (example.images || []).slice(0, 3).map(img => `
    <img src="${img}" class="image-thumb" onclick="event.stopPropagation();window.open('${img}')" style="width:40px;height:40px;object-fit:cover;">
  `).join('');

  const tagsHtml = (example.tags || []).map(t => `
    <span class="tag tag-filterable" data-tag="${escapeHtml(t)}" style="cursor:pointer;">${escapeHtml(t)}</span>
  `).join('');

  // 卡片预览：剥离 LaTeX 命令，只显示可读文本
  const plainPreview = stripLatex((example.content || '').substring(0, 150));
  const hasMore = (example.content || '').length > 150;

  return `
    <div class="card example-card" data-example-id="${example.id}">
      <div class="card-header">
        <span class="card-title">${escapeHtml(example.title)}</span>
        <div style="display:flex;gap:4px;">
          <button class="btn-icon btn-edit-example" data-example-id="${example.id}" title="编辑">✏️</button>
          <button class="btn-icon btn-delete-example" data-example-id="${example.id}" title="删除">🗑️</button>
        </div>
      </div>
      <div style="font-size:12px;color:var(--warm-400);margin-bottom:6px;">
        ${course ? `📚 ${escapeHtml(course.name)}` : '未分类'}
      </div>
      <div style="font-size:13px;color:var(--warm-600);margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">
        ${escapeHtml(plainPreview)}${hasMore ? '...' : ''}
      </div>
      ${tagsHtml ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">${tagsHtml}</div>` : ''}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;">
        <div style="display:flex;gap:4px;">${imagesHtml}</div>
        ${fileHint}
      </div>
    </div>`;
}

// ===== 仅刷新结果区域（不重建搜索栏，保持输入流畅） =====
function refreshExampleResults() {
  const resultsDiv = document.getElementById('exampleResults');
  if (!resultsDiv) return;

  const allExamples = getExamples();
  let examples = allExamples;
  if (exampleFilterCourseId) {
    examples = examples.filter(e => e.courseId === exampleFilterCourseId);
  }
  if (exampleSearchQuery.trim()) {
    const q = exampleSearchQuery.trim().toLowerCase();
    examples = examples.filter(e => {
      const titleMatch = (e.title || '').toLowerCase().includes(q);
      const contentMatch = (e.content || '').toLowerCase().includes(q);
      const tagList = Array.isArray(e.tags) ? e.tags : [];
      const tagMatch = tagList.some(t => (t || '').toLowerCase() === q);
      return titleMatch || contentMatch || tagMatch;
    });
  }

  if (examples.length === 0) {
    resultsDiv.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <p>${allExamples.length === 0 ? '还没有任何例题' : '没有匹配的例题'}</p>
      </div>`;
  } else {
    resultsDiv.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;" id="exampleGrid">
        ${examples.map(example => renderExampleCard(example)).join('')}
      </div>`;
  }
  bindExampleCardEvents();
}

// ===== 绑定卡片事件 =====
function bindExampleCardEvents() {
  // 编辑
  document.querySelectorAll('.btn-edit-example').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const example = getExamples().find(ex => ex.id === btn.dataset.exampleId);
      if (example) showExampleModal(example);
    });
  });

  // 删除
  document.querySelectorAll('.btn-delete-example').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const example = getExamples().find(ex => ex.id === btn.dataset.exampleId);
      if (example && confirm(`确定删除例题「${example.title}」吗？`)) {
        deleteExample(example.id);
        renderExampleView();
        showToast('例题已删除', 'success');
      }
    });
  });

  // 点击 tag → 精确搜索该 tag
  document.querySelectorAll('.tag-filterable').forEach(tag => {
    tag.addEventListener('click', (e) => {
      e.stopPropagation();
      exampleSearchQuery = tag.dataset.tag;
      const searchInput = document.getElementById('exampleSearch');
      if (searchInput) searchInput.value = exampleSearchQuery;
      refreshExampleResults();
    });
  });

  // 点击卡片展开详情
  document.querySelectorAll('.example-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('.tag') || e.target.closest('img')) return;
      const example = getExamples().find(ex => ex.id === card.dataset.exampleId);
      if (example) showExampleDetailModal(example);
    });
  });
}

// ===== 例题详情弹窗 =====
function showExampleDetailModal(example) {
  const course = getCourseById(example.courseId);

  const imagesHtml = (example.images || []).map(img => `
    <img src="${img}" style="max-width:100%;border-radius:6px;margin-bottom:4px;cursor:pointer;"
         onclick="window.open('${img}')">
  `).join('');

  const pdfsHtml = (example.pdfs || []).map((pdf, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--warm-bg);border:1px solid var(--warm-200);border-radius:6px;margin-bottom:4px;cursor:pointer;"
         class="pdf-link" data-pdf-index="${i}">
      <span style="font-size:20px;">📄</span>
      <span style="font-size:13px;color:var(--dusty-blue);">${escapeHtml(pdf.name)}</span>
    </div>
  `).join('');

  const tagsHtml = (example.tags || []).map(t => `
    <span class="tag">${escapeHtml(t)}</span>
  `).join('');

  const bodyHtml = `
    <div style="margin-bottom:12px;">
      ${course ? `<span class="tag" style="margin-right:8px;">📚 ${escapeHtml(course.name)}</span>` : ''}
      ${tagsHtml}
    </div>
    <div style="margin-bottom:12px;">
      <label style="font-weight:600;font-size:12px;color:var(--warm-500);">题目</label>
      <div style="padding:8px;background:var(--warm-bg);border-radius:6px;margin-top:4px;" class="latex-content">
        ${renderMixedLatex(example.content || '')}
      </div>
    </div>
    ${example.solution ? `
      <div style="margin-bottom:12px;">
        <label style="font-weight:600;font-size:12px;color:var(--warm-500);">解题思路</label>
        <div style="padding:8px;background:var(--warm-bg);border-radius:6px;margin-top:4px;" class="latex-content">
          ${renderMixedLatex(example.solution)}
        </div>
      </div>` : ''}
    ${(imagesHtml || pdfsHtml) ? `
      <div>
        <label style="font-weight:600;font-size:12px;color:var(--warm-500);">附件</label>
        <div style="margin-top:4px;">${imagesHtml}${pdfsHtml}</div>
      </div>` : ''}
    <div style="display:flex;justify-content:flex-end;margin-top:16px;">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove();showExampleModal(getExamples().find(e=>e.id==='${example.id}'))">编辑</button>
    </div>`;

  showModal(example.title, bodyHtml, () => {});

  // 绑定 PDF 点击事件
  setTimeout(() => {
    document.querySelectorAll('.pdf-link').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.pdfIndex);
        const pdf = (example.pdfs || [])[idx];
        if (pdf) openPdf(pdf.data, pdf.name);
      });
    });
  }, 50);
}

// ===== 新建/编辑例题弹窗 =====
function showExampleModal(existingExample = null) {
  const isEdit = !!existingExample;
  const example = existingExample || {
    id: '',
    title: '',
    content: '',
    solution: '',
    tags: [],
    images: [],
    pdfs: [],
    courseId: AppState.currentCourseId || '',
  };
  const courses = getCourses();

  // 文件预览（图片 + PDF）
  let filePreviewHtml = '';
  (example.images || []).forEach((img, i) => {
    filePreviewHtml += `
      <div style="position:relative;display:inline-block;margin:4px;">
        <img src="${img}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid var(--warm-200);">
        <button class="btn-remove-file" data-type="image" data-index="${i}"
                style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--red-500);color:white;font-size:12px;line-height:20px;text-align:center;cursor:pointer;">✕</button>
      </div>`;
  });
  (example.pdfs || []).forEach((pdf, i) => {
    filePreviewHtml += `
      <div style="position:relative;display:inline-block;margin:4px;padding:8px;background:var(--warm-bg);border:1px solid var(--warm-200);border-radius:6px;width:80px;text-align:center;">
        <span style="font-size:24px;">📄</span>
        <div style="font-size:10px;color:var(--warm-500);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(pdf.name)}">${escapeHtml(pdf.name)}</div>
        <button class="btn-remove-file" data-type="pdf" data-index="${i}"
                style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--red-500);color:white;font-size:12px;line-height:20px;text-align:center;cursor:pointer;">✕</button>
      </div>`;
  });

  const tagsStr = (example.tags || []).map(t => `<span class="tag">${escapeHtml(t)} <span class="tag-remove" data-tag="${escapeHtml(t)}">✕</span></span>`).join(' ');

  const bodyHtml = `
    <div class="form-group">
      <label>所属课程</label>
      <select class="form-input" id="exampleCourse">
        <option value="">选择课程...</option>
        ${courses.map(c => `
          <option value="${c.id}" ${example.courseId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>
        `).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>例题标题</label>
      <input class="form-input" id="exampleTitle" value="${escapeHtml(example.title)}" placeholder="例如：用极限定义证明数列收敛" autofocus>
    </div>
    <div class="form-group">
      <label>题目内容（可直接输入 LaTeX 公式，如 \frac{1}{2}；也可用 $...$ 混合文字）</label>
      <textarea class="form-input form-textarea" id="exampleContent" placeholder="输入题目内容...">${escapeHtml(example.content)}</textarea>
    </div>
    <div class="form-group">
      <label>解题思路（支持 LaTeX 公式）</label>
      <textarea class="form-input form-textarea" id="exampleSolution" placeholder="输入解题思路...">${escapeHtml(example.solution || '')}</textarea>
    </div>
    <div class="form-group">
      <label>图片 & PDF</label>
      <input type="file" id="exampleFileInput" accept="image/*,application/pdf" multiple style="margin-bottom:8px;">
      <div id="exampleFilePreview">${filePreviewHtml}</div>
      <input type="hidden" id="exampleImagesData" value="">
    </div>
    <div class="form-group">
      <label>Tag 标签（与概念关联，回车添加）</label>
      <div id="tagContainer" style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;padding:6px;border:1px solid var(--warm-300);border-radius:6px;min-height:36px;">
        ${tagsStr}
        <input id="tagInput" placeholder="输入 tag 后按回车..." style="border:none;outline:none;flex:1;min-width:100px;font-size:13px;">
      </div>
    </div>`;

  // 临时存储文件数据
  let tempImages = [...(example.images || [])];
  let tempPdfs = [...(example.pdfs || [])];

  showModal(isEdit ? '编辑例题' : '新建例题', bodyHtml, (overlay) => {
    const title = overlay.querySelector('#exampleTitle').value.trim();
    if (!title) {
      showToast('请输入例题标题', 'error');
      return;
    }
    const courseId = overlay.querySelector('#exampleCourse').value;
    if (!courseId) {
      showToast('请选择所属课程', 'error');
      return;
    }

    const tags = [];
    overlay.querySelectorAll('#tagContainer .tag').forEach(tagEl => {
      const tagText = tagEl.textContent.replace('✕', '').trim();
      if (tagText) tags.push(tagText);
    });

    const updatedExample = {
      id: example.id || generateId(),
      title: title,
      content: overlay.querySelector('#exampleContent').value.trim(),
      solution: overlay.querySelector('#exampleSolution').value.trim(),
      tags: tags,
      images: tempImages,
      pdfs: tempPdfs,
      courseId: courseId,
    };

    if (isEdit) {
      updateExample(updatedExample.id, updatedExample);
    } else {
      addExample(updatedExample);
    }

    overlay.remove();
    renderExampleView();
    showToast(isEdit ? '例题已更新' : '例题创建成功', 'success');
  });

  // Tag 输入逻辑
  setTimeout(() => {
    const tagInput = document.getElementById('tagInput');
    const tagContainer = document.getElementById('tagContainer');

    if (!tagInput || !tagContainer) return;

    function addTag(text) {
      const tag = text.replace(/[,，]/g, '').trim();
      if (!tag) return;
      // 检查是否已存在
      const existing = tagContainer.querySelectorAll('.tag');
      for (const el of existing) {
        if (el.textContent.replace('✕', '').trim() === tag) return;
      }
      const tagEl = document.createElement('span');
      tagEl.className = 'tag';
      tagEl.innerHTML = `${escapeHtml(tag)} <span class="tag-remove">✕</span>`;
      tagEl.querySelector('.tag-remove').addEventListener('click', () => tagEl.remove());
      tagContainer.insertBefore(tagEl, tagInput);
    }

    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(tagInput.value);
        tagInput.value = '';
      }
    });

    // 失焦也确认输入
    tagInput.addEventListener('blur', () => {
      addTag(tagInput.value);
      tagInput.value = '';
    });

    // 已有 tag 的删除事件
    tagContainer.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', () => btn.parentElement.remove());
    });

    // 文件上传（图片 + PDF）
    const fileInput = document.getElementById('exampleFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
          const reader = new FileReader();
          if (file.type === 'application/pdf') {
            reader.onload = (ev) => {
              tempPdfs.push({ data: ev.target.result, name: file.name });
              refreshFilePreview(tempImages, tempPdfs);
            };
          } else {
            reader.onload = (ev) => {
              tempImages.push(ev.target.result);
              refreshFilePreview(tempImages, tempPdfs);
            };
          }
          reader.readAsDataURL(file);
        });
      });
    }
  }, 50);
}

// ===== 刷新文件预览（图片 + PDF） =====
function refreshFilePreview(images, pdfs) {
  const preview = document.getElementById('exampleFilePreview');
  if (!preview) return;

  let html = '';
  (images || []).forEach((img, i) => {
    html += `
      <div style="position:relative;display:inline-block;margin:4px;">
        <img src="${img}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid var(--warm-200);">
        <button data-remove-image="${i}"
                style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--red-500);color:white;font-size:12px;line-height:20px;text-align:center;cursor:pointer;">✕</button>
      </div>`;
  });
  (pdfs || []).forEach((pdf, i) => {
    html += `
      <div style="position:relative;display:inline-block;margin:4px;padding:8px;background:var(--warm-bg);border:1px solid var(--warm-200);border-radius:6px;width:80px;text-align:center;">
        <span style="font-size:24px;">📄</span>
        <div style="font-size:10px;color:var(--warm-500);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(pdf.name)}">${escapeHtml(pdf.name)}</div>
        <button data-remove-pdf="${i}"
                style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--red-500);color:white;font-size:12px;line-height:20px;text-align:center;cursor:pointer;">✕</button>
      </div>`;
  });
  preview.innerHTML = html;

  preview.querySelectorAll('[data-remove-image]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.removeImage);
      if (images) images.splice(idx, 1);
      refreshFilePreview(images, pdfs);
    });
  });
  preview.querySelectorAll('[data-remove-pdf]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.removePdf);
      if (pdfs) pdfs.splice(idx, 1);
      refreshFilePreview(images, pdfs);
    });
  });
}

// ===== 剥离 LaTeX 命令，保留可读文本（卡片预览用） =====
function stripLatex(text) {
  if (!text) return '';
  return text
    .replace(/\$\$[\s\S]*?\$\$/g, '')   // 移除 $$...$$
    .replace(/\$[\s\S]*?\$/g, '')       // 移除 $...$
    .replace(/\\[a-zA-Z]+(\{[^}]*\})*/g, '')  // 移除 \command{...}
    .replace(/\\[a-zA-Z]+/g, '')        // 移除 \command
    .replace(/[{}\\]/g, '')             // 移除花括号和反斜杠
    .replace(/\s+/g, ' ')               // 合并空白
    .trim();
}

// ===== 在新窗口中打开 PDF =====
function openPdf(dataUrl, filename) {
  const w = window.open('', '_blank');
  if (!w) {
    showToast('弹窗被拦截，请允许此网站的弹窗', 'error');
    return;
  }
  w.document.write(`
    <!DOCTYPE html>
    <html><head><title>${escapeHtml(filename)}</title>
    <style>
      body { margin: 0; padding: 0; display: flex; flex-direction: column; height: 100vh; }
      .toolbar { padding: 10px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
                 display: flex; align-items: center; gap: 12px; font-family: sans-serif; }
      .toolbar span { font-size: 14px; font-weight: 600; color: #3d3835; }
      .toolbar a { font-size: 12px; color: #8a9b9e; text-decoration: none; }
      iframe { flex: 1; border: none; }
    </style></head><body>
    <div class="toolbar">
      <span>📄 ${escapeHtml(filename)}</span>
      <a href="${dataUrl}" download="${escapeHtml(filename)}">⬇ 下载</a>
    </div>
    <iframe src="${dataUrl}"></iframe>
    </body></html>
  `);
  w.document.close();
}

// ===== 概念详情页显示关联例题 =====
function getRelatedExamplesByTag(tags) {
  if (!tags || tags.length === 0) return [];
  const allExamples = getExamples();
  return allExamples.filter(e =>
    (e.tags || []).some(t => tags.includes(t))
  );
}
