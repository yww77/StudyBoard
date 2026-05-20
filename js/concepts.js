/**
 * concepts.js — 概念 + 自定义推导区块 + 公式实时预览
 */

// ===== 新建/编辑概念弹窗 =====
function showConceptModal(chapterId, existingConcept = null) {
  const isEdit = !!existingConcept;
  const concept = existingConcept || {
    id: '',
    name: '',
    description: '',
    formula: '',
    derivationBlocks: [
      { id: generateId(), title: 'Bemerkung', content: '' },
      { id: generateId(), title: 'Beweis', content: '' },
      { id: generateId(), title: '意义/运用', content: '' },
    ],
  };

  let blocksHtml = (concept.derivationBlocks || []).map((block, i) => `
    <div class="derivation-block" data-block-id="${block.id}">
      <div class="derivation-title">
        <span>📌 ${escapeHtml(block.title)}</span>
        <button class="btn-icon btn-remove-block" data-block-id="${block.id}" title="删除此区块" style="color:var(--red-500);">✕</button>
      </div>
      <textarea class="form-input form-textarea block-content" data-block-id="${block.id}"
                placeholder="输入内容（支持 LaTeX 公式）" style="min-height:60px;">${escapeHtml(block.content || '')}</textarea>
    </div>
  `).join('');

  const bodyHtml = `
    <div class="form-group">
      <label>概念名称</label>
      <input class="form-input" id="conceptName" value="${escapeHtml(concept.name)}" placeholder="例如：极限的定义" autofocus>
    </div>
    <div class="form-group">
      <label>文字描述</label>
      <textarea class="form-input form-textarea" id="conceptDesc" placeholder="简要描述这个概念...">${escapeHtml(concept.description)}</textarea>
    </div>
    <div class="form-group">
      <label>公式（LaTeX 语法）</label>
      <div style="display:flex;gap:8px;align-items:flex-start;">
        <div style="flex:1;">
          <textarea class="form-input form-textarea" id="conceptFormula"
                    placeholder="例如：\\lim_{x \\to a} f(x) = L" style="font-family:Consolas,monospace;min-height:50px;">${escapeHtml(concept.formula || '')}</textarea>
          <div style="font-size:11px;color:var(--gray-400);margin-top:4px;">
            使用 LaTeX 语法，参考「公式参考」标签页
          </div>
        </div>
      </div>
      <div class="formula-preview" id="formulaPreview"></div>
    </div>
    <div class="form-group">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <label style="margin-bottom:0;">推导过程区块</label>
        <button class="btn btn-secondary btn-sm" id="btnAddBlock">+ 添加区块</button>
      </div>
      <div id="derivationBlocks">
        ${blocksHtml}
      </div>
    </div>`;

  const title = isEdit ? '编辑概念' : '新建概念';
  showModal(title, bodyHtml, (overlay) => {
    const name = overlay.querySelector('#conceptName').value.trim();
    if (!name) {
      showToast('请输入概念名称', 'error');
      return;
    }

    // 收集所有区块数据
    const blocks = [];
    overlay.querySelectorAll('.derivation-block').forEach(blockEl => {
      const blockId = blockEl.dataset.blockId;
      const titleEl = blockEl.querySelector('.derivation-title span');
      const contentEl = blockEl.querySelector('.block-content');
      const titleText = titleEl.textContent.replace('📌 ', '');
      blocks.push({
        id: blockId,
        title: titleText,
        content: contentEl.value,
      });
    });

    const updatedConcept = {
      id: concept.id || generateId(),
      name: name,
      description: overlay.querySelector('#conceptDesc').value.trim(),
      formula: overlay.querySelector('#conceptFormula').value.trim(),
      derivationBlocks: blocks,
    };

    // 保存到课程数据
    const course = getCourseById(AppState.currentCourseId);
    if (!course) return;

    const chapter = course.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return;

    if (!chapter.concepts) chapter.concepts = [];

    if (isEdit) {
      const idx = chapter.concepts.findIndex(c => c.id === updatedConcept.id);
      if (idx !== -1) chapter.concepts[idx] = updatedConcept;
    } else {
      chapter.concepts.push(updatedConcept);
    }

    updateCourse(course.id, { chapters: course.chapters });
    overlay.remove();
    renderChapterView(course);
    showToast(isEdit ? '概念已更新' : '概念创建成功', 'success');
  });

  // 公式实时预览
  const formulaInput = document.querySelector('#conceptFormula');
  const preview = document.querySelector('#formulaPreview');

  function safeRender(latex, target) {
    if (!target) return;
    if (typeof katex === 'undefined') {
      target.innerHTML = '<span style="color:#f59e0b;font-size:12px;">⚠ KaTeX 未加载，请检查网络后刷新页面</span>';
      return;
    }
    if (!latex.trim()) {
      target.innerHTML = '';
      return;
    }
    try {
      katex.render(latex.trim(), target, { throwOnError: false, displayMode: true });
    } catch (e) {
      target.innerHTML = '<span style="color:var(--red-500);font-size:12px;">公式语法错误：请检查 LaTeX 代码</span>';
    }
  }

  formulaInput.addEventListener('input', debounce(() => {
    safeRender(formulaInput.value, preview);
  }, 300));
  // 初始渲染
  safeRender(concept.formula || '', preview);

  // 删除区块
  overlay = document.querySelector('.modal-overlay'); // 获取刚创建的 overlay
  const setupBlockEvents = () => {
    document.querySelectorAll('.btn-remove-block').forEach(btn => {
      btn.addEventListener('click', () => {
        const blockEl = document.querySelector(`.derivation-block[data-block-id="${btn.dataset.blockId}"]`);
        if (blockEl) blockEl.remove();
      });
    });
  };
  setupBlockEvents();

  // 添加区块
  document.querySelector('#btnAddBlock').addEventListener('click', () => {
    const title = prompt('请输入区块标题（如：引理、推论、注意等）：');
    if (!title || !title.trim()) return;
    const blockId = generateId();
    const blockHtml = `
      <div class="derivation-block" data-block-id="${blockId}">
        <div class="derivation-title">
          <span>📌 ${escapeHtml(title.trim())}</span>
          <button class="btn-icon btn-remove-block" data-block-id="${blockId}" title="删除此区块" style="color:var(--red-500);">✕</button>
        </div>
        <textarea class="form-input form-textarea block-content" data-block-id="${blockId}"
                  placeholder="输入内容（支持 LaTeX 公式）" style="min-height:60px;"></textarea>
      </div>`;
    document.querySelector('#derivationBlocks').insertAdjacentHTML('beforeend', blockHtml);
    // 绑定新按钮
    document.querySelector(`.btn-remove-block[data-block-id="${blockId}"]`).addEventListener('click', () => {
      document.querySelector(`.derivation-block[data-block-id="${blockId}"]`).remove();
    });
  });
}

// ===== 渲染概念详情（章节视图中的展开卡片） =====
function renderConceptsInChapter(chapter) {
  const concepts = chapter.concepts || [];
  if (concepts.length === 0) {
    return `<div style="padding:8px 0;color:var(--gray-400);font-size:12px;">
      <button class="btn btn-secondary btn-sm" data-chapter-id="${chapter.id}"
              onclick="event.stopPropagation();showConceptModal('${chapter.id}')">+ 添加概念</button>
    </div>`;
  }

  return `
    <div style="display:flex;flex-direction:column;gap:4px;padding:4px 0;">
      ${concepts.map(c => `
        <div class="concept-card" data-concept-id="${c.id}">
          <div class="concept-card-header">
            <div style="display:flex;align-items:center;gap:8px;flex:1;">
              <span style="font-size:14px;font-weight:600;color:var(--gray-700);">${escapeHtml(c.name)}</span>
              ${c.formula ? `<span style="font-size:12px;color:var(--blue-400);">📐 含公式</span>` : ''}
            </div>
            <div style="display:flex;gap:4px;" onclick="event.stopPropagation();">
              <button class="btn-icon btn-edit-concept" data-chapter-id="${chapter.id}" data-concept-id="${c.id}" title="编辑">✏️</button>
              <button class="btn-icon btn-delete-concept" data-chapter-id="${chapter.id}" data-concept-id="${c.id}" title="删除">🗑️</button>
            </div>
          </div>
          <div class="concept-card-body">
            ${c.description ? `<p style="margin-bottom:8px;color:var(--gray-600);">${escapeHtml(c.description)}</p>` : ''}
            ${c.formula ? `
              <div style="margin-bottom:10px;padding:8px 0;">
                <span style="font-size:11px;color:var(--gray-400);">公式：</span>
                <div class="concept-formula-render" data-formula="${escapeHtml(c.formula)}"></div>
              </div>` : ''}
            ${(c.derivationBlocks || []).length > 0 ? `
              <div style="border-top:1px solid var(--gray-200);padding-top:10px;">
                <span style="font-size:11px;color:var(--gray-400);">推导过程：</span>
                ${c.derivationBlocks.map(b => `
                  <div style="margin:6px 0;padding:8px;background:var(--blue-50);border-radius:4px;border-left:3px solid var(--blue-300);">
                    <strong style="font-size:12px;color:var(--blue-700);">${escapeHtml(b.title)}</strong>
                    <div class="block-formula-render" data-content="${escapeHtml(b.content || '')}" style="margin-top:4px;font-size:13px;color:var(--gray-700);"></div>
                  </div>
                `).join('')}
              </div>` : ''}
          </div>
        </div>
      `).join('')}
      <button class="btn btn-secondary btn-sm" data-chapter-id="${chapter.id}"
              onclick="event.stopPropagation();showConceptModal('${chapter.id}')">+ 添加概念</button>
    </div>`;
}

// ===== 渲染概念中的 KaTeX 公式（在概念卡片展开后调用） =====
function renderConceptFormulas(container) {
  if (typeof katex === 'undefined') return;
  container.querySelectorAll('.concept-formula-render').forEach(el => {
    const formula = el.dataset.formula;
    if (formula) {
      try {
        katex.render(formula, el, { throwOnError: false, displayMode: true });
      } catch (e) {
        el.innerHTML = '<span style="color:var(--red-500);">公式渲染失败</span>';
      }
    }
  });
  container.querySelectorAll('.block-formula-render').forEach(el => {
    const content = el.dataset.content;
    if (content) {
      el.innerHTML = renderMixedLatex(content);
    }
  });
}

// ===== 混合文本与 LaTeX 渲染 =====
function renderMixedLatex(text) {
  if (typeof katex === 'undefined') return escapeHtml(text);
  if (!text || !text.trim()) return '';

  // 检测是否含有 $...$ 或 $$...$$ 标记
  const hasDollarDelimiter = /\$/.test(text);

  if (!hasDollarDelimiter) {
    // 检测是否看起来像纯 LaTeX（含 \frac, \mathbf, \sum 等命令）
    const latexPatterns = /\\frac|\\sqrt|\\sum|\\int|\\lim|\\mathbf|\\boldsymbol|\\left|\\right|\\begin|\\alpha|\\beta|\\gamma|\\delta|\\epsilon|\\theta|\\lambda|\\mu|\\pi|\\sigma|\\phi|\\omega|\\partial|\\infty|\\nabla|\\pm|\\cdot|\\times|\\leq|\\geq|\\neq|\\approx|\\to|\\rightarrow|\\Rightarrow|\\longrightarrow/;
    if (latexPatterns.test(text)) {
      // 纯 LaTeX 公式，自动用 $$ 包裹
      try {
        return katex.renderToString(text.trim(), { throwOnError: false, displayMode: true });
      } catch (e) {
        return `<code>${escapeHtml(text)}</code>`;
      }
    }
    // 普通文本
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  // 混合模式：处理 $$...$$ 和 $...$
  let result = escapeHtml(text);
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
    try {
      return katex.renderToString(latex.trim(), { throwOnError: false, displayMode: true });
    } catch (e) {
      return `<code>${latex}</code>`;
    }
  });
  result = result.replace(/\$([\s\S]*?)\$/g, (_, latex) => {
    try {
      return katex.renderToString(latex.trim(), { throwOnError: false, displayMode: false });
    } catch (e) {
      return `<code>${latex}</code>`;
    }
  });
  return result;
}

// ===== 概念卡片展开/折叠事件 =====
function bindConceptCardEvents(container) {
  container.querySelectorAll('.concept-card-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.parentElement;
      const wasOpen = card.classList.contains('open');
      // 关闭同级所有卡片
      card.parentElement.querySelectorAll('.concept-card').forEach(c => c.classList.remove('open'));
      if (!wasOpen) {
        card.classList.add('open');
        renderConceptFormulas(card);
      }
    });
  });

  // 编辑概念
  container.querySelectorAll('.btn-edit-concept').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const chapterId = btn.dataset.chapterId;
      const conceptId = btn.dataset.conceptId;
      const course = getCourseById(AppState.currentCourseId);
      if (!course) return;
      const chapter = course.chapters.find(ch => ch.id === chapterId);
      if (!chapter) return;
      const concept = (chapter.concepts || []).find(c => c.id === conceptId);
      if (concept) showConceptModal(chapterId, concept);
    });
  });

  // 删除概念
  container.querySelectorAll('.btn-delete-concept').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const chapterId = btn.dataset.chapterId;
      const conceptId = btn.dataset.conceptId;
      const course = getCourseById(AppState.currentCourseId);
      if (!course) return;
      const chapter = course.chapters.find(ch => ch.id === chapterId);
      if (!chapter) return;
      const concept = (chapter.concepts || []).find(c => c.id === conceptId);
      if (concept && confirm(`确定删除概念「${concept.name}」吗？`)) {
        chapter.concepts = chapter.concepts.filter(c => c.id !== conceptId);
        updateCourse(course.id, { chapters: course.chapters });
        renderChapterView(course);
        showToast('概念已删除', 'success');
      }
    });
  });
}
