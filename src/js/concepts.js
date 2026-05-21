/**
 * concepts.js — 概念 + 自定义推导区块 + 公式实时预览
 */

// ===== 概念层级工具函数 =====

// 获取某概念的所有子孙 ID（用于过滤父概念选项）
function getDescendantIds(conceptId, allConcepts) {
  const ids = [];
  (allConcepts || []).filter(c => c.parentId === conceptId).forEach(c => {
    ids.push(c.id);
    ids.push(...getDescendantIds(c.id, allConcepts));
  });
  return ids;
}

// 沿 parentId 链向上计算概念深度（0=顶层, 1=子, 2=孙子）
function getConceptDepth(conceptId, allConcepts) {
  let depth = 0;
  let current = (allConcepts || []).find(c => c.id === conceptId);
  while (current && current.parentId && depth < 10) {
    depth++;
    current = (allConcepts || []).find(c => c.id === current.parentId);
  }
  return depth;
}

// 获取章节内可作为父概念的选项列表
// excludeConceptId: 排除自身（编辑时）+ 自身所有子孙（防循环引用）
function getEligibleParents(chapter, excludeConceptId) {
  const concepts = chapter.concepts || [];
  const excludeIds = new Set();
  if (excludeConceptId) {
    excludeIds.add(excludeConceptId);
    getDescendantIds(excludeConceptId, concepts).forEach(id => excludeIds.add(id));
  }

  // 如果要排除的概念有子节点，则只能选深度 0 的做父级（避免孙子变曾孙）
  const hasChildren = excludeConceptId
    ? concepts.some(c => c.parentId === excludeConceptId)
    : false;
  const maxParentDepth = hasChildren ? 0 : 1;

  const eligible = [];
  concepts.filter(c => !excludeIds.has(c.id)).forEach(c => {
    const depth = getConceptDepth(c.id, concepts);
    if (depth <= maxParentDepth) {
      eligible.push({ id: c.id, name: c.name, depth });
    }
  });
  return eligible;
}

// ===== 新建/编辑概念弹窗 =====
function showConceptModal(chapterId, existingConcept = null) {
  const isEdit = !!existingConcept;
  const concept = existingConcept || {
    id: '',
    name: '',
    description: '',
    formula: '',
    parentId: null,
    showInMindmap: true,
    derivationBlocks: [
      { id: generateId(), title: 'Bemerkung', content: '' },
      { id: generateId(), title: 'Beweis', content: '' },
      { id: generateId(), title: '意义/运用', content: '' },
    ],
  };

  // 获取章节数据以构建父概念选项
  const result = getChapter(AppState.currentCourseId, chapterId);
  const chapter = result ? result.chapter : null;
  const eligibleParents = chapter ? getEligibleParents(chapter, concept.id) : [];

  const parentOptionsHtml = eligibleParents.map(p => {
    const indent = '　'.repeat(p.depth); // 全角空格缩进
    const prefix = p.depth > 0 ? '↳ ' : ''; // ↳ 箭头
    return `<option value="${p.id}" ${p.id === concept.parentId ? 'selected' : ''}>${indent}${prefix}${escapeHtml(p.name)}</option>`;
  }).join('');

  let blocksHtml = (concept.derivationBlocks || []).map((block, i) => `
    <div class="derivation-block" data-block-id="${block.id}">
      <div class="derivation-title">
        <span><i data-lucide="pin"></i> ${escapeHtml(block.title)}</span>
        <button class="btn-icon btn-remove-block" data-block-id="${block.id}" title="删除此区块" style="color:var(--danger);"><i data-lucide="x"></i></button>
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
      <label>父概念</label>
      <select class="form-input" id="conceptParent">
        <option value="" ${!concept.parentId ? 'selected' : ''}>(无 — 作为顶层概念)</option>
        ${parentOptionsHtml}
      </select>
      <div class="text-muted" style="margin-top:4px;">子概念可再嵌套一层，最多支持 3 层</div>
    </div>
    <div class="form-group">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
        <input type="checkbox" id="conceptShowInMindmap" ${concept.showInMindmap !== false ? 'checked' : ''} style="width:16px;height:16px;cursor:pointer;">
        显示在思维导图中
      </label>
      <div class="text-muted" style="margin-top:2px;">取消勾选后该概念不会出现在思维导图里</div>
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
          <div class="text-muted" style="margin-top:4px;">
            使用 LaTeX 语法，参考「公式参考」标签页
          </div>
        </div>
      </div>
      <div class="formula-preview" id="formulaPreview"></div>
    </div>
    <div class="form-group">
      <div class="flex-between mb-sm">
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
      const titleText = titleEl.textContent.trim();
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
      parentId: overlay.querySelector('#conceptParent').value || null,
      showInMindmap: overlay.querySelector('#conceptShowInMindmap').checked,
      derivationBlocks: blocks,
    };

    if (!saveConcept(AppState.currentCourseId, chapterId, updatedConcept)) {
      showToast('保存失败，课程或章节不存在', 'error');
      return;
    }
    overlay.remove();
    const course = getCourseById(AppState.currentCourseId);
    renderChapterView(course);
    showToast(isEdit ? '概念已更新' : '概念创建成功', 'success');
  });

  // 公式实时预览
  const formulaInput = document.querySelector('#conceptFormula');
  const preview = document.querySelector('#formulaPreview');

  formulaInput.addEventListener('input', debounce(() => {
    safeRenderKatex(formulaInput.value, preview, true);
  }, 300));
  // 初始渲染
  safeRenderKatex(concept.formula || '', preview, true);

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
          <span><i data-lucide="pin"></i> ${escapeHtml(title.trim())}</span>
          <button class="btn-icon btn-remove-block" data-block-id="${blockId}" title="删除此区块" style="color:var(--danger);"><i data-lucide="x"></i></button>
        </div>
        <textarea class="form-input form-textarea block-content" data-block-id="${blockId}"
                  placeholder="输入内容（支持 LaTeX 公式）" style="min-height:60px;"></textarea>
      </div>`;
    document.querySelector('#derivationBlocks').insertAdjacentHTML('beforeend', blockHtml);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    // 绑定新按钮
    document.querySelector(`.btn-remove-block[data-block-id="${blockId}"]`).addEventListener('click', () => {
      document.querySelector(`.derivation-block[data-block-id="${blockId}"]`).remove();
    });
  });
}

// ===== 渲染概念详情（章节视图中的展开卡片） =====

// 从扁平概念数组构建嵌套树结构
function buildConceptTree(concepts) {
  const map = {};
  const roots = [];
  (concepts || []).forEach(c => { map[c.id] = { ...c, children: [] }; });
  (concepts || []).forEach(c => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].children.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  return roots;
}

// 渲染单个概念卡片 HTML（不含树形包裹）
function renderSingleConceptCard(concept, chapter) {
  return `
    <div class="concept-card" data-concept-id="${concept.id}">
      <div class="concept-card-header">
        <div style="display:flex;align-items:center;gap:8px;flex:1;">
          <span style="font-size:14px;font-weight:600;color:var(--ink-light);">${escapeHtml(concept.name)}</span>
          ${concept.formula ? `<span style="font-size:12px;color:var(--slate);"><i data-lucide="sigma"></i> 含公式</span>` : ''}
          ${concept.showInMindmap === false ? `<span style="font-size:11px;color:var(--ink-muted);">不在导图中</span>` : ''}
        </div>
        <div style="display:flex;gap:4px;" onclick="event.stopPropagation();">
          <button class="btn-icon btn-edit-concept" data-chapter-id="${chapter.id}" data-concept-id="${concept.id}" title="编辑"><i data-lucide="pencil"></i></button>
          <button class="btn-icon btn-delete-concept" data-chapter-id="${chapter.id}" data-concept-id="${concept.id}" title="删除"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      <div class="concept-card-body">
        ${concept.description ? `<p class="mb-sm" style="color:var(--ink-light);">${escapeHtml(concept.description)}</p>` : ''}
        ${concept.formula ? `
          <div style="margin-bottom:10px;padding:8px 0;">
            <span class="text-muted">公式：</span>
            <div class="concept-formula-render" data-formula="${escapeHtml(concept.formula)}"></div>
          </div>` : ''}
        ${(concept.derivationBlocks || []).length > 0 ? `
          <div style="border-top:1px solid var(--paper-border);padding-top:10px;">
            <span class="text-muted">推导过程：</span>
            ${concept.derivationBlocks.map(b => `
              <div style="margin:6px 0;padding:8px;background:var(--slate-bg);border-radius:var(--radius);border-left:3px solid var(--paper-border);">
                <strong style="font-size:12px;color:var(--ink);">${escapeHtml(b.title)}</strong>
                <div class="block-formula-render" data-content="${escapeHtml(b.content || '')}" style="margin-top:4px;font-size:13px;color:var(--ink-light);"></div>
              </div>
            `).join('')}
          </div>` : ''}
      </div>
    </div>`;
}

// 递归渲染概念树节点
function renderConceptTreeNodes(nodes, chapter, depth) {
  if (!nodes || nodes.length === 0) return '';
  const levelBars = ['var(--rose)', 'var(--slate)', 'var(--sage)'];

  return nodes.map(concept => {
    const hasChildren = concept.children && concept.children.length > 0;
    const barColor = levelBars[Math.min(depth, 2)];

    return `
      <div class="concept-tree-node" data-depth="${depth}" data-concept-id="${concept.id}">
        <div class="concept-tree-row" style="padding-left:${depth * 24}px;">
          ${depth > 0 ? `<span class="concept-level-bar" style="background:${barColor};"></span>` : ''}
          ${hasChildren
            ? `<span class="tree-toggle tree-toggle-open" data-concept-id="${concept.id}" title="折叠子树"><i data-lucide="chevron-down"></i></span>`
            : `<span class="tree-toggle-spacer"></span>`}
          ${renderSingleConceptCard(concept, chapter)}
        </div>
        ${hasChildren ? `<div class="concept-tree-children" data-parent-id="${concept.id}">${renderConceptTreeNodes(concept.children, chapter, depth + 1)}</div>` : ''}
      </div>`;
  }).join('');
}

function renderConceptsInChapter(chapter) {
  const concepts = chapter.concepts || [];
  if (concepts.length === 0) {
    return `<div class="text-muted" style="padding:8px 0;">
      <button class="btn btn-secondary btn-sm" data-chapter-id="${chapter.id}"
              onclick="event.stopPropagation();showConceptModal('${chapter.id}')">+ 添加概念</button>
    </div>`;
  }

  const tree = buildConceptTree(concepts);
  return `
    <div class="flex-col gap-xs" style="padding:4px 0;">
      ${renderConceptTreeNodes(tree, chapter, 0)}
      <button class="btn btn-secondary btn-sm" data-chapter-id="${chapter.id}"
              onclick="event.stopPropagation();showConceptModal('${chapter.id}')">+ 添加概念</button>
    </div>`;
}

// ===== 渲染概念中的 KaTeX 公式（在概念卡片展开后调用） =====
function renderConceptFormulas(container) {
  container.querySelectorAll('.concept-formula-render').forEach(el => {
    const formula = el.dataset.formula;
    if (formula) {
      safeRenderKatex(formula, el, true);
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
      const rendered = safeRenderKatexToString(text.trim(), true);
      if (rendered !== null) return rendered;
      return `<code>${escapeHtml(text)}</code>`;
    }
    // 普通文本
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  // 混合模式：处理 $$...$$ 和 $...$
  let result = escapeHtml(text);
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
    const rendered = safeRenderKatexToString(latex.trim(), true);
    return rendered !== null ? rendered : `<code>${latex}</code>`;
  });
  result = result.replace(/\$([\s\S]*?)\$/g, (_, latex) => {
    const rendered = safeRenderKatexToString(latex.trim(), false);
    return rendered !== null ? rendered : `<code>${latex}</code>`;
  });
  return result;
}

// ===== 概念卡片展开/折叠事件 =====
function bindConceptCardEvents(container) {
  // 树形折叠/展开按钮
  container.querySelectorAll('.tree-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const conceptId = toggle.dataset.conceptId;
      const isOpen = toggle.classList.contains('tree-toggle-open');
      // 找到所属的 concept-tree-node，切换子树可见性
      const treeNode = toggle.closest('.concept-tree-node');
      const children = treeNode ? treeNode.querySelector(':scope > .concept-tree-children') : null;
      if (children) {
        children.style.display = isOpen ? 'none' : 'block';
      }
      toggle.classList.toggle('tree-toggle-open', !isOpen);
      toggle.classList.toggle('tree-toggle-closed', isOpen);
    });
  });

  // 概念卡片展开/折叠（点击标题区域）
  container.querySelectorAll('.concept-card-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.parentElement;
      const wasOpen = card.classList.contains('open');
      if (!wasOpen) {
        card.classList.add('open');
        renderConceptFormulas(card);
      } else {
        card.classList.remove('open');
      }
    });
  });

  // 编辑概念
  container.querySelectorAll('.btn-edit-concept').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const chapterId = btn.dataset.chapterId;
      const conceptId = btn.dataset.conceptId;
      const result = getConcept(AppState.currentCourseId, chapterId, conceptId);
      if (result) showConceptModal(chapterId, result.concept);
    });
  });

  // 删除概念
  container.querySelectorAll('.btn-delete-concept').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const chapterId = btn.dataset.chapterId;
      const conceptId = btn.dataset.conceptId;
      const result = getConcept(AppState.currentCourseId, chapterId, conceptId);
      if (!result) return;
      const chapter = result.chapter;
      const concept = result.concept;
      const descendantCount = getDescendantIds(conceptId, chapter.concepts || []).length;
      let msg = `确定删除概念「${concept.name}」吗？`;
      if (descendantCount > 0) {
        msg = `确定删除概念「${concept.name}」吗？\n\n将同时删除其下 ${descendantCount} 个嵌套子概念，此操作不可撤销。`;
      }
      if (confirm(msg)) {
        if (!deleteConcept(AppState.currentCourseId, chapterId, conceptId, true)) {
          showToast('删除失败', 'error');
          return;
        }
        const course = getCourseById(AppState.currentCourseId);
        renderChapterView(course);
        showToast(descendantCount > 0 ? `已删除概念及 ${descendantCount} 个子概念` : '概念已删除', 'success');
      }
    });
  });
}
