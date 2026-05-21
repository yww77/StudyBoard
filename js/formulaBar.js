/**
 * formulaBar.js — 公式符号快捷工具栏
 * 阶段 4：基础实现；阶段 8：完善优化
 */

// 常用 LaTeX 符号分组
const FORMULA_GROUPS = [
  {
    name: '微积分',
    symbols: [
      { label: '极限', code: '\\lim_{x \\to a}' },
      { label: '无穷', code: '\\infty' },
      { label: '导数', code: '\\frac{d}{dx}' },
      { label: '偏导', code: '\\frac{\\partial}{\\partial x}' },
      { label: '积分', code: '\\int_{a}^{b}' },
      { label: '二重积分', code: '\\iint' },
      { label: '求和', code: '\\sum_{i=1}^{n}' },
      { label: '乘积', code: '\\prod_{i=1}^{n}' },
    ]
  },
  {
    name: '希腊字母',
    symbols: [
      { label: 'α', code: '\\alpha' },
      { label: 'β', code: '\\beta' },
      { label: 'γ', code: '\\gamma' },
      { label: 'δ', code: '\\delta' },
      { label: 'ε', code: '\\epsilon' },
      { label: 'θ', code: '\\theta' },
      { label: 'λ', code: '\\lambda' },
      { label: 'μ', code: '\\mu' },
      { label: 'π', code: '\\pi' },
      { label: 'σ', code: '\\sigma' },
      { label: 'φ', code: '\\phi' },
      { label: 'ω', code: '\\omega' },
      { label: 'Δ', code: '\\Delta' },
      { label: 'Ω', code: '\\Omega' },
    ]
  },
  {
    name: '结构',
    symbols: [
      { label: '分数', code: '\\frac{}{}' },
      { label: '根号', code: '\\sqrt{}' },
      { label: 'n次根', code: '\\sqrt[n]{}' },
      { label: '上标', code: '^{}' },
      { label: '下标', code: '_{}' },
      { label: '括号', code: '\\left( \\right)' },
      { label: '绝对值', code: '\\left| \\right|' },
    ]
  },
  {
    name: '符号',
    symbols: [
      { label: '±', code: '\\pm' },
      { label: '≤', code: '\\leq' },
      { label: '≥', code: '\\geq' },
      { label: '≠', code: '\\neq' },
      { label: '≈', code: '\\approx' },
      { label: '∀', code: '\\forall' },
      { label: '∃', code: '\\exists' },
      { label: '∈', code: '\\in' },
      { label: '→', code: '\\to' },
      { label: '⇒', code: '\\Rightarrow' },
    ]
  }
];

// 在光标处插入文本到 textarea
function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(end);
  textarea.value = before + text + after;
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
  // 触发 input 事件以更新预览
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

// 创建公式工具栏 HTML
function renderFormulaToolbar(targetInputId) {
  return FORMULA_GROUPS.map(group => `
    <div style="margin-bottom:6px;">
      <span class="text-muted" style="display:block;margin-bottom:4px;">${group.name}</span>
      <div style="display:flex;flex-wrap:wrap;gap:4px;">
        ${group.symbols.map(s => `
          <button class="btn btn-secondary btn-sm formula-btn"
                  data-code="${escapeHtml(s.code)}"
                  data-target="${targetInputId}"
                  title="${escapeHtml(s.code)}"
                  style="font-size:12px;padding:3px 8px;">${s.label}</button>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// 绑定公式按钮事件
function bindFormulaButtons(container) {
  container.querySelectorAll('.formula-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetInput = document.getElementById(btn.dataset.target);
      if (targetInput) {
        insertAtCursor(targetInput, btn.dataset.code);
      }
    });
  });
}
