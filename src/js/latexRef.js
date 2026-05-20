/**
 * latexRef.js — LaTeX 公式参考库
 */

// 分类及符号数据
const LATEX_CATEGORIES = [
  {
    id: 'greek',
    name: '希腊字母',
    items: [
      { desc: 'alpha', code: '\\alpha' },
      { desc: 'beta', code: '\\beta' },
      { desc: 'gamma', code: '\\gamma' },
      { desc: 'delta', code: '\\delta' },
      { desc: 'epsilon', code: '\\epsilon' },
      { desc: 'varepsilon', code: '\\varepsilon' },
      { desc: 'zeta', code: '\\zeta' },
      { desc: 'eta', code: '\\eta' },
      { desc: 'theta', code: '\\theta' },
      { desc: 'vartheta', code: '\\vartheta' },
      { desc: 'iota', code: '\\iota' },
      { desc: 'kappa', code: '\\kappa' },
      { desc: 'lambda', code: '\\lambda' },
      { desc: 'mu', code: '\\mu' },
      { desc: 'nu', code: '\\nu' },
      { desc: 'xi', code: '\\xi' },
      { desc: 'pi', code: '\\pi' },
      { desc: 'rho', code: '\\rho' },
      { desc: 'sigma', code: '\\sigma' },
      { desc: 'tau', code: '\\tau' },
      { desc: 'phi', code: '\\phi' },
      { desc: 'varphi', code: '\\varphi' },
      { desc: 'chi', code: '\\chi' },
      { desc: 'psi', code: '\\psi' },
      { desc: 'omega', code: '\\omega' },
      { desc: 'Gamma', code: '\\Gamma' },
      { desc: 'Delta', code: '\\Delta' },
      { desc: 'Theta', code: '\\Theta' },
      { desc: 'Lambda', code: '\\Lambda' },
      { desc: 'Pi', code: '\\Pi' },
      { desc: 'Sigma', code: '\\Sigma' },
      { desc: 'Phi', code: '\\Phi' },
      { desc: 'Psi', code: '\\Psi' },
      { desc: 'Omega', code: '\\Omega' },
    ]
  },
  {
    id: 'calculus',
    name: '微积分',
    items: [
      { desc: '极限', code: '\\lim_{x \\to a} f(x)' },
      { desc: '无穷', code: '\\infty' },
      { desc: '趋于', code: '\\to' },
      { desc: '导数', code: '\\frac{d}{dx}' },
      { desc: '偏导数', code: '\\frac{\\partial}{\\partial x}' },
      { desc: '一阶导', code: "f'(x)" },
      { desc: '二阶导', code: "f''(x)" },
      { desc: 'n阶导', code: 'f^{(n)}(x)' },
      { desc: '定积分', code: '\\int_{a}^{b} f(x)\\,dx' },
      { desc: '不定积分', code: '\\int f(x)\\,dx' },
      { desc: '二重积分', code: '\\iint' },
      { desc: '三重积分', code: '\\iiint' },
      { desc: '环路积分', code: '\\oint' },
      { desc: '求和', code: '\\sum_{i=1}^{n}' },
      { desc: '连乘积', code: '\\prod_{i=1}^{n}' },
      { desc: '梯度', code: '\\nabla' },
      { desc: '偏导符号', code: '\\partial' },
      { desc: '微分dx', code: 'dx' },
      { desc: '拉普拉斯', code: '\\Delta' },
    ]
  },
  {
    id: 'linalg',
    name: '线性代数',
    items: [
      { desc: '矩阵', code: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
      { desc: '行列式', code: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}' },
      { desc: 'bmatrix', code: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}' },
      { desc: '向量', code: '\\vec{v}' },
      { desc: '单位向量', code: '\\hat{i}' },
      { desc: '转置', code: 'A^{\\top}' },
      { desc: '逆矩阵', code: 'A^{-1}' },
      { desc: '点积', code: '\\vec{a} \\cdot \\vec{b}' },
      { desc: '叉积', code: '\\vec{a} \\times \\vec{b}' },
      { desc: '范数', code: '\\|\\vec{v}\\|' },
      { desc: '特征值', code: '\\lambda' },
      { desc: '对角矩阵', code: '\\operatorname{diag}(a_1,\\ldots,a_n)' },
      { desc: '迹', code: '\\operatorname{tr}(A)' },
      { desc: '秩', code: '\\operatorname{rank}(A)' },
      { desc: '行列式', code: '\\det(A)' },
    ]
  },
  {
    id: 'complex',
    name: '复数',
    items: [
      { desc: '虚数单位', code: 'i' },
      { desc: '复数', code: 'z = a + bi' },
      { desc: '共轭', code: '\\overline{z}' },
      { desc: '模长', code: '\\lvert z \\rvert' },
      { desc: '辐角', code: '\\arg(z)' },
      { desc: '实部', code: '\\Re(z)' },
      { desc: '虚部', code: '\\Im(z)' },
      { desc: '欧拉公式', code: 'e^{i\\theta} = \\cos\\theta + i\\sin\\theta' },
      { desc: '极坐标形式', code: 'z = r(\\cos\\theta + i\\sin\\theta)' },
    ]
  },
  {
    id: 'setlogic',
    name: '集合与逻辑',
    items: [
      { desc: '属于', code: '\\in' },
      { desc: '不属于', code: '\\notin' },
      { desc: '子集', code: '\\subset' },
      { desc: '真子集', code: '\\subsetneq' },
      { desc: '并集', code: '\\cup' },
      { desc: '交集', code: '\\cap' },
      { desc: '空集', code: '\\emptyset' },
      { desc: '全集', code: '\\mathbb{U}' },
      { desc: '自然数集', code: '\\mathbb{N}' },
      { desc: '整数集', code: '\\mathbb{Z}' },
      { desc: '有理数集', code: '\\mathbb{Q}' },
      { desc: '实数集', code: '\\mathbb{R}' },
      { desc: '复数集', code: '\\mathbb{C}' },
      { desc: '任意', code: '\\forall' },
      { desc: '存在', code: '\\exists' },
      { desc: '不存在', code: '\\nexists' },
      { desc: '蕴含', code: '\\implies' },
      { desc: '等价', code: '\\iff' },
      { desc: '且', code: '\\land' },
      { desc: '或', code: '\\lor' },
      { desc: '非', code: '\\neg' },
    ]
  },
  {
    id: 'functions',
    name: '函数与运算符',
    items: [
      { desc: '三角函数', code: '\\sin, \\cos, \\tan' },
      { desc: '反正弦', code: '\\arcsin' },
      { desc: '双曲正弦', code: '\\sinh' },
      { desc: '对数', code: '\\log' },
      { desc: '自然对数', code: '\\ln' },
      { desc: '指数', code: 'e^{x}' },
      { desc: '根号', code: '\\sqrt{x}' },
      { desc: 'n次根', code: '\\sqrt[n]{x}' },
      { desc: '分数', code: '\\frac{a}{b}' },
      { desc: '绝对值', code: '\\lvert x \\rvert' },
      { desc: '取整函数', code: '\\lfloor x \\rfloor' },
      { desc: '上取整', code: '\\lceil x \\rceil' },
      { desc: 'max', code: '\\max' },
      { desc: 'min', code: '\\min' },
      { desc: 'sup', code: '\\sup' },
      { desc: 'inf', code: '\\inf' },
      { desc: '极限', code: '\\lim' },
    ]
  },
  {
    id: 'relations',
    name: '关系与符号',
    items: [
      { desc: '等于', code: '=' },
      { desc: '不等于', code: '\\neq' },
      { desc: '约等于', code: '\\approx' },
      { desc: '恒等于', code: '\\equiv' },
      { desc: '正比于', code: '\\propto' },
      { desc: '小于等于', code: '\\leq' },
      { desc: '大于等于', code: '\\geq' },
      { desc: '远小于', code: '\\ll' },
      { desc: '远大于', code: '\\gg' },
      { desc: '加减', code: '\\pm' },
      { desc: '乘号', code: '\\times' },
      { desc: '除号', code: '\\div' },
      { desc: '点乘', code: '\\cdot' },
      { desc: '度', code: '^{\\circ}' },
      { desc: '因为', code: '\\because' },
      { desc: '所以', code: '\\therefore' },
      { desc: '平行', code: '\\parallel' },
      { desc: '垂直', code: '\\perp' },
      { desc: '角度', code: '\\angle' },
      { desc: '三角形', code: '\\triangle' },
      { desc: '圆', code: '\\circ' },
    ]
  },
  {
    id: 'arrows',
    name: '箭头',
    items: [
      { desc: '右箭头', code: '\\to' },
      { desc: '右箭头2', code: '\\rightarrow' },
      { desc: '左箭头', code: '\\leftarrow' },
      { desc: '双箭头', code: '\\leftrightarrow' },
      { desc: '右双线', code: '\\Rightarrow' },
      { desc: '左双线', code: '\\Leftarrow' },
      { desc: '双线双箭', code: '\\Leftrightarrow' },
      { desc: '映射', code: '\\mapsto' },
      { desc: '长箭头', code: '\\longrightarrow' },
      { desc: '上箭头', code: '\\uparrow' },
      { desc: '下箭头', code: '\\downarrow' },
    ]
  },
  {
    id: 'decorations',
    name: '装饰与标注',
    items: [
      { desc: '上标', code: 'x^{2}' },
      { desc: '下标', code: 'x_{i}' },
      { desc: '上下标', code: 'x_{i}^{2}' },
      { desc: '帽子', code: '\\hat{x}' },
      { desc: '横线', code: '\\overline{x}' },
      { desc: '下横线', code: '\\underline{x}' },
      { desc: '波浪线', code: '\\tilde{x}' },
      { desc: '向量箭头', code: '\\vec{x}' },
      { desc: '点', code: '\\dot{x}' },
      { desc: '双点', code: '\\ddot{x}' },
      { desc: '花体', code: '\\mathcal{F}' },
      { desc: '粗体', code: '\\mathbf{x}' },
      { desc: '黑板粗体', code: '\\mathbb{R}' },
      { desc: '上括号', code: '\\overbrace{a+b+c}' },
      { desc: '下括号', code: '\\underbrace{a+b+c}' },
      { desc: '上方文字', code: '\\overset{def}{=}' },
      { desc: '下方文字', code: '\\underset{x \\in X}{\\max}' },
    ]
  },
];

// 当前选中的分类
let latexRefActiveCategory = 'greek';

// ===== 渲染公式参考库视图 =====
function renderLatexRefView() {
  const content = document.getElementById('content');
  const activeCategory = LATEX_CATEGORIES.find(c => c.id === latexRefActiveCategory) || LATEX_CATEGORIES[0];

  content.innerHTML = `
    <h2 style="font-size:18px;font-weight:700;color:var(--warm-700);margin-bottom:16px;">📖 公式参考库</h2>
    <div class="latex-ref-layout">
      <div class="latex-ref-sidebar" id="latexRefSidebar">
        ${LATEX_CATEGORIES.map(c => `
          <div class="latex-ref-sidebar-item ${c.id === latexRefActiveCategory ? 'active' : ''}"
               data-category="${c.id}">${c.name}</div>
        `).join('')}
      </div>
      <div class="latex-ref-content" id="latexRefContent">
        <h3 style="font-size:15px;font-weight:600;color:var(--warm-600);margin-bottom:12px;">
          ${activeCategory.name}
        </h3>
        <table class="latex-ref-table">
          <thead>
            <tr><th style="width:30%;">说明</th><th style="width:30%;">LaTeX 代码</th><th style="width:40%;">渲染效果</th></tr>
          </thead>
          <tbody>
            ${activeCategory.items.map(item => {
              let rendered = '';
              if (typeof katex !== 'undefined') {
                try {
                  rendered = katex.renderToString(item.code, { throwOnError: false, displayMode: false });
                } catch (e) {
                  rendered = '<span style="color:var(--red-500);">渲染失败</span>';
                }
              }
              return `
                <tr class="latex-ref-row" data-code="${escapeHtml(item.code)}" title="点击复制 LaTeX 代码">
                  <td>${escapeHtml(item.desc)}</td>
                  <td><code class="latex-ref-code">${escapeHtml(item.code)}</code></td>
                  <td>${rendered}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  // 分类切换
  content.querySelectorAll('.latex-ref-sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      latexRefActiveCategory = item.dataset.category;
      renderLatexRefView();
      // 滚动到顶部
      content.querySelector('#latexRefContent').scrollTop = 0;
    });
  });

  // 点击复制
  content.querySelectorAll('.latex-ref-row').forEach(row => {
    row.addEventListener('click', () => {
      const code = row.dataset.code;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
          showToast('已复制: ' + code, 'success');
        }).catch(() => {
          fallbackCopy(code);
        });
      } else {
        fallbackCopy(code);
      }
    });
  });
}

// 兜底复制方案
function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast('已复制: ' + text, 'success');
  } catch (e) {
    showToast('复制失败，请手动复制', 'error');
  }
  document.body.removeChild(textarea);
}
