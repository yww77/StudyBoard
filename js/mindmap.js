/**
 * mindmap.js — SVG 思维导图 + 拖拽节点 + 曲线连线 + 节点详情 + 自定义颜色
 */

let mindmapState = {
  svg: null,
  courseId: null,
  nodes: [],
  connections: [],
  nodePositions: {},
  nodeColors: {},
  dragging: null,
  dragOffset: { x: 0, y: 0 },
  connecting: null,
  viewBox: { x: 0, y: 0, w: 1000, h: 600 },
  zoom: 1,
  undoStack: [],
  selectedConnection: null,
  tempWaypoints: [],        // 连线创建中的临时拐点
  previewPath: null,        // 预览路径元素
  draggingWaypoint: null,   // { connIdx, wpIdx, startX, startY }
};

const NODE_COLORS = [
  '#8a9b9e', '#c4958b', '#9bae8c', '#c4b998', '#a0988e',
  '#b59a8c', '#8a9b8c', '#9b8a8e', '#a09b8e', '#9b8e8a',
];

// ===== 思维导图主视图 =====
function renderMindmapView() {
  const content = document.getElementById('content');
  const courses = getCourses();
  const courseId = mindmapState.courseId || AppState.currentCourseId || (courses[0] && courses[0].id);

  if (!courseId || courses.length === 0) {
    content.innerHTML = '<div class="empty-state"><div class="empty-icon"><i data-lucide="git-graph"></i></div><p>请先创建课程和概念</p></div>';
    return;
  }

  mindmapState.courseId = courseId;
  const course = getCourseById(courseId);
  if (!course) return;

  // 收集所有概念，按 showInMindmap 过滤（默认显示）
  const concepts = [];
  (course.chapters || []).forEach(ch => {
    (ch.concepts || []).forEach(c => {
      if (c.showInMindmap !== false) {
        concepts.push({ ...c, chapterTitle: ch.title });
      }
    });
  });

  if (!course.mindmapNodePositions) course.mindmapNodePositions = {};
  if (!course.mindmapNodeColors) course.mindmapNodeColors = {};
  const positions = course.mindmapNodePositions;
  const colors = course.mindmapNodeColors;

  concepts.forEach((c, i) => {
    if (!positions[c.id]) {
      const col = Math.floor(i / 4);
      const row = i % 4;
      positions[c.id] = {
        x: 120 + col * 260 + Math.random() * 30,
        y: 80 + row * 160 + Math.random() * 20,
      };
    }
    if (!colors[c.id]) {
      colors[c.id] = NODE_COLORS[i % NODE_COLORS.length];
    }
  });

  mindmapState.nodes = concepts.map(c => ({
    id: c.id,
    x: positions[c.id].x,
    y: positions[c.id].y,
    name: c.name,
    formula: c.formula || '',
    description: c.description || '',
    chapterTitle: c.chapterTitle,
  }));

  mindmapState.connections = course.mindmapConnections || [];
  mindmapState.nodePositions = positions;
  mindmapState.nodeColors = colors;

  content.innerHTML = `
    <div class="flex-between" style="margin-bottom:12px;">
      <div class="flex-center gap-md">
        <h2 style="font-size:18px;font-weight:700;color:var(--ink);"><i data-lucide="git-graph"></i> 思维导图</h2>
        <select class="form-input" id="mindmapCourseSelect" style="width:200px;">
          ${courses.map(c => `<option value="${c.id}" ${c.id === courseId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="flex-center gap-sm">
        <span class="text-muted" style="margin-right:8px;">滚轮缩放 | 拖拽平移 | 拖拽节点 | 双击连线 | 右键菜单</span>
        <button class="btn btn-sm" id="btnExportPdf" style="background:#dc2626;color:#fff;border:none;"><i data-lucide="file-output"></i> 导出 PDF</button>
        <button class="btn btn-secondary btn-sm" id="btnResetView">重置视图</button>
      </div>
    </div>
    <div id="mindmap-canvas" style="width:100%;height:calc(100vh - 160px);position:relative;overflow:hidden;">
      <svg id="mindmapSvg"></svg>
    </div>`;

  const canvas = document.getElementById('mindmap-canvas');
  const svg = document.getElementById('mindmapSvg');
  mindmapState.svg = svg;
  mindmapState.viewBox = { x: -40, y: -40, w: canvas.clientWidth, h: canvas.clientHeight };

  svg.setAttribute('viewBox', `${mindmapState.viewBox.x} ${mindmapState.viewBox.y} ${mindmapState.viewBox.w} ${mindmapState.viewBox.h}`);
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.cursor = 'grab';
  svg.style.background = '#f8fafc';

  renderMindmap();
  bindMindmapEvents(canvas, svg, course);

  document.getElementById('mindmapCourseSelect').addEventListener('change', (e) => {
    mindmapState.courseId = e.target.value;
    renderMindmapView();
  });

  document.getElementById('btnResetView').addEventListener('click', () => {
    const cvs = document.getElementById('mindmap-canvas');
    mindmapState.viewBox = { x: -40, y: -40, w: cvs.clientWidth, h: cvs.clientHeight };
    renderMindmap();
  });

  document.getElementById('btnExportPdf').addEventListener('click', () => {
    exportMindmapPDF(course);
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// 导出思维导图为 PDF（通过浏览器打印）
function exportMindmapPDF(course) {
  const svg = mindmapState.svg;
  if (!svg) return;

  // 克隆 SVG 并放大到适合打印的尺寸
  const clone = svg.cloneNode(true);
  const vb = mindmapState.viewBox;
  clone.setAttribute('viewBox', `${vb.x - 20} ${vb.y - 20} ${vb.w + 40} ${vb.h + 40}`);
  clone.setAttribute('width', '100%');
  clone.setAttribute('height', '100%');
  clone.style.background = '#ffffff';

  const svgData = new XMLSerializer().serializeToString(clone);
  const printWin = window.open('', '_blank', 'width=1200,height=900');
  if (!printWin) { showToast('请允许弹出窗口以导出 PDF', 'error'); return; }

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>思维导图 — ${escapeHtml(course.name)}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
        svg { max-width: 100%; max-height: 95vh; }
        @media print {
          @page { size: A3 landscape; margin: 10mm; }
          body { padding: 0; }
          svg { max-width: 100%; max-height: 100%; }
        }
        .mm-name { font-weight: 700 !important; font-size: 13px !important; color: #3d3835 !important; line-height: 1.3 !important; word-wrap: break-word !important; }
        .mm-formula { font-size: 11px !important; color: #8a9b9e !important; word-wrap: break-word !important; overflow-wrap: break-word !important; }
        .mm-desc { font-size: 10px !important; color: #a0988e !important; word-wrap: break-word !important; }
      </style>
    </head>
    <body>${svgData}</body>
    </html>
  `);
  printWin.document.close();

  // 等待 KaTeX 加载后打印
  printWin.onload = () => {
    setTimeout(() => {
      printWin.print();
      showToast('请在打印对话框中选择「另存为 PDF」', 'info');
    }, 800);
  };
}

// 估算文本行数（用于动态节点高度）
function estimateTextLines(text, fontSize, maxWidth) {
  if (!text) return 0;
  let width = 0;
  let lines = 1;
  for (const ch of text) {
    const charW = /[一-鿿　-〿＀-￯]/.test(ch)
      ? fontSize * 1.05
      : fontSize * 0.58;
    if (width + charW > maxWidth) {
      lines++;
      width = charW;
    } else {
      width += charW;
    }
  }
  return lines;
}

// ===== 渲染节点（foreignObject + KaTeX）和曲线连线 =====
function renderMindmap() {
  const svg = mindmapState.svg;
  const nodes = mindmapState.nodes;
  const connections = mindmapState.connections;
  const vb = mindmapState.viewBox;
  const nodeColors = mindmapState.nodeColors;

  svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);

  // 清空 SVG 内容（保留 viewBox）
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // 用 createElementNS 创建 defs，确保 SVG 命名空间正确
  const SVG = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(SVG, 'defs');

  // 箭头标记（终点）
  const arrowMarker = document.createElementNS(SVG, 'marker');
  arrowMarker.setAttribute('id', 'arrowhead');
  arrowMarker.setAttribute('markerWidth', '14');
  arrowMarker.setAttribute('markerHeight', '10');
  arrowMarker.setAttribute('refX', '12');
  arrowMarker.setAttribute('refY', '5');
  arrowMarker.setAttribute('orient', 'auto');
  const arrowPoly = document.createElementNS(SVG, 'polygon');
  arrowPoly.setAttribute('points', '0 1, 12 5, 0 9');
  arrowPoly.setAttribute('fill', '#8a9b9e');
  arrowPoly.setAttribute('stroke', '#7a8b8e');
  arrowPoly.setAttribute('stroke-width', '0.5');
  arrowMarker.appendChild(arrowPoly);
  defs.appendChild(arrowMarker);

  // 起点圆点标记
  const dotMarker = document.createElementNS(SVG, 'marker');
  dotMarker.setAttribute('id', 'startdot');
  dotMarker.setAttribute('markerWidth', '8');
  dotMarker.setAttribute('markerHeight', '8');
  dotMarker.setAttribute('refX', '4');
  dotMarker.setAttribute('refY', '4');
  dotMarker.setAttribute('orient', 'auto');
  const dotCircle = document.createElementNS(SVG, 'circle');
  dotCircle.setAttribute('cx', '4');
  dotCircle.setAttribute('cy', '4');
  dotCircle.setAttribute('r', '3.5');
  dotCircle.setAttribute('fill', '#8a9b9e');
  dotMarker.appendChild(dotCircle);
  defs.appendChild(dotMarker);

  svg.appendChild(defs);

  // 预先计算所有节点尺寸（连线裁剪需要）
  nodes.forEach(node => {
    node._nodeW = 210;
    const textMaxW = node._nodeW - 24;
    const nameLines = estimateTextLines(node.name, 13, textMaxW);
    const nameH = nameLines * 17;
    const formulaLines = node.formula ? (node.formula.length > 30 ? 2 : 1) : 0;
    const formulaH = formulaLines * 17;
    const descLines = node.description ? estimateTextLines(node.description, 10, textMaxW) : 0;
    const descH = descLines * 13;
    node._nodeH = Math.max(52, nameH + formulaH + descH + (node.description && descLines ? 2 : 0) + 14);
  });

  // --- 连线 ---
  const connGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  connections.forEach((conn, idx) => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    if (!fromNode || !toNode) return;

    const waypoints = conn.waypoints || [];
    const pathD = calcConnectionPath(fromNode, toNode, waypoints);
    const labelWp = waypoints.length > 0 ? waypoints[Math.floor(waypoints.length / 2)] : null;
    const mx = labelWp ? labelWp.x : (fromNode.x + toNode.x) / 2;
    const my = labelWp ? labelWp.y : (fromNode.y + toNode.y) / 2;

    const isSelected = mindmapState.selectedConnection === idx;

    // 隐形宽点击区域
    const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hitPath.setAttribute('d', pathD);
    hitPath.setAttribute('stroke', 'transparent');
    hitPath.setAttribute('stroke-width', '14');
    hitPath.setAttribute('fill', 'none');
    hitPath.style.cursor = 'pointer';
    hitPath.dataset.connIdx = idx;
    hitPath.dataset.from = conn.from;
    hitPath.dataset.to = conn.to;
    hitPath.addEventListener('click', (e) => {
      e.stopPropagation();
      if (mindmapState.selectedConnection === idx) {
        mindmapState.selectedConnection = null;
      } else {
        mindmapState.selectedConnection = idx;
      }
      renderMindmap();
    });
    connGroup.appendChild(hitPath);

    // 可见连线
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', pathD);
    pathEl.setAttribute('stroke', isSelected ? '#c97070' : '#8a9b9e');
    pathEl.setAttribute('stroke-width', isSelected ? '3.5' : '2');
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('marker-start', 'url(#startdot)');
    pathEl.setAttribute('marker-end', 'url(#arrowhead)');
    pathEl.dataset.from = conn.from;
    pathEl.dataset.to = conn.to;
    pathEl.dataset.connIdx = idx;
    pathEl.style.cursor = 'pointer';
    pathEl.style.pointerEvents = 'none';
    if (isSelected) {
      pathEl.setAttribute('filter', 'drop-shadow(0 0 3px rgba(199,112,112,0.5))');
    }
    connGroup.appendChild(pathEl);

    // 拐点圆点（可拖拽）
    waypoints.forEach((wp, wpi) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', wp.x);
      circle.setAttribute('cy', wp.y);
      circle.setAttribute('r', '5');
      circle.setAttribute('fill', isSelected ? '#c97070' : '#c4958b');
      circle.setAttribute('stroke', '#fdfcfa');
      circle.setAttribute('stroke-width', '2');
      circle.style.cursor = 'grab';
      circle.dataset.connIdx = idx;
      circle.dataset.wpIdx = wpi;
      circle.classList.add('waypoint-circle');
      connGroup.appendChild(circle);
    });

    // 标签
    if (conn.label) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', mx);
      text.setAttribute('y', my - 12);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '11');
      text.setAttribute('fill', isSelected ? '#c97070' : '#7a8b8e');
      text.setAttribute('font-weight', isSelected ? '700' : '500');
      text.setAttribute('class', 'conn-label');
      text.dataset.from = conn.from;
      text.dataset.to = conn.to;
      text.textContent = conn.label;
      text.style.pointerEvents = 'none';
      connGroup.appendChild(text);
    }
  });
  svg.appendChild(connGroup);

  // --- 节点 ---
  const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  nodes.forEach(node => {
    const color = nodeColors[node.id] || '#8a9b9e';
    const isConnecting = mindmapState.connecting === node.id;
    const nodeW = node._nodeW || 210;
    const nodeH = node._nodeH || 52;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
    g.dataset.nodeId = node.id;
    g.style.cursor = 'pointer';

    // 背景
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', -nodeW / 2);
    rect.setAttribute('y', -nodeH / 2);
    rect.setAttribute('width', nodeW);
    rect.setAttribute('height', nodeH);
    rect.setAttribute('rx', '10');
    rect.setAttribute('fill', isConnecting ? '#eff6ff' : 'white');
    rect.setAttribute('stroke', isConnecting ? '#8a9b9e' : color);
    rect.setAttribute('stroke-width', isConnecting ? '2.5' : '2');
    rect.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))');
    g.appendChild(rect);

    // 左侧颜色条
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bar.setAttribute('x', -nodeW / 2);
    bar.setAttribute('y', -nodeH / 2);
    bar.setAttribute('width', '5');
    bar.setAttribute('height', nodeH);
    bar.setAttribute('rx', '10');
    bar.setAttribute('fill', color);
    g.appendChild(bar);

    // foreignObject 嵌入 HTML（支持 KaTeX）
    const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    fo.setAttribute('x', -nodeW / 2 + 10);
    fo.setAttribute('y', -nodeH / 2);
    fo.setAttribute('width', nodeW - 16);
    fo.setAttribute('height', nodeH);
    fo.setAttribute('class', 'mindmap-fo');

    let formulaHtml = '';
    if (node.formula) {
      const rendered = safeRenderKatexToString(node.formula, false);
      formulaHtml = rendered !== null
        ? `<div class="mm-formula" style="font-size:11px;color:#8a9b9e;word-wrap:break-word;overflow-wrap:break-word;">${rendered}</div>`
        : `<div class="mm-formula" style="font-size:10px;color:#a0988e;word-wrap:break-word;overflow-wrap:break-word;">${escapeHtml(node.formula)}</div>`;
    }

    fo.innerHTML = `
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;font-size:12px;padding:4px 6px 4px 0;word-wrap:break-word;overflow-wrap:break-word;display:flex;flex-direction:column;justify-content:center;">
        <div class="mm-name" style="font-weight:700;font-size:13px;color:#3d3835;line-height:1.3;word-wrap:break-word;">${escapeHtml(node.name)}</div>
        ${formulaHtml}
        ${node.description ? `<div class="mm-desc" style="font-size:10px;color:#a0988e;word-wrap:break-word;margin-top:1px;">${escapeHtml(node.description)}</div>` : ''}
      </div>`;
    g.appendChild(fo);

    nodeGroup.appendChild(g);
  });
  svg.appendChild(nodeGroup);

  // 连线创建中：渲染临时拐点圆点
  if (mindmapState.connecting && mindmapState.tempWaypoints.length > 0) {
    const tempGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mindmapState.tempWaypoints.forEach(wp => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', wp.x);
      circle.setAttribute('cy', wp.y);
      circle.setAttribute('r', '5');
      circle.setAttribute('fill', '#c4958b');
      circle.setAttribute('stroke', '#fdfcfa');
      circle.setAttribute('stroke-width', '2');
      circle.style.pointerEvents = 'none';
      tempGroup.appendChild(circle);
    });
    svg.appendChild(tempGroup);
  }

  // 清除预览路径引用（已被清空）
  mindmapState.previewPath = null;
}

// ===== 计算贝塞尔曲线路径 =====

// ===== 计算贝塞尔曲线路径 =====
// 将线段 (x1,y1)->(x2,y2) 裁剪到以 (rx,ry) 为中心的矩形边缘
// 返回矩形边界上的交点（从 x1,y1 方向进入矩形的点）
function clipToRectEdge(x1, y1, x2, y2, rx, ry, rw, rh) {
  const hw = rw / 2 + 2; // +2 让箭头略微离开节点
  const hh = rh / 2 + 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return { x: x2, y: y2 };

  let bestT = 0;
  // 左边缘
  if (dx !== 0) {
    const t = (rx - hw - x1) / dx;
    const y = y1 + t * dy;
    if (t > 0 && t < 1 && y >= ry - hh && y <= ry + hh) bestT = Math.max(bestT, t);
  }
  // 右边缘
  if (dx !== 0) {
    const t = (rx + hw - x1) / dx;
    const y = y1 + t * dy;
    if (t > 0 && t < 1 && y >= ry - hh && y <= ry + hh) bestT = Math.max(bestT, t);
  }
  // 上边缘
  if (dy !== 0) {
    const t = (ry - hh - y1) / dy;
    const x = x1 + t * dx;
    if (t > 0 && t < 1 && x >= rx - hw && x <= rx + hw) bestT = Math.max(bestT, t);
  }
  // 下边缘
  if (dy !== 0) {
    const t = (ry + hh - y1) / dy;
    const x = x1 + t * dx;
    if (t > 0 && t < 1 && x >= rx - hw && x <= rx + hw) bestT = Math.max(bestT, t);
  }
  return { x: x1 + bestT * dx, y: y1 + bestT * dy };
}

function calcCurvePath(fromNode, toNode) {
  const fw = fromNode._nodeW || 210;
  const fh = fromNode._nodeH || 52;
  const tw = toNode._nodeW || 210;
  const th = toNode._nodeH || 52;

  // 原始端点（节点中心）
  const sx = fromNode.x, sy = fromNode.y;
  const ex = toNode.x, ey = toNode.y;

  const dx = ex - sx;
  const dy = ey - sy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = -dy / dist;
  const perpY = dx / dist;
  const bend = Math.min(dist * 0.25, 60);
  const cx = (sx + ex) / 2 + perpX * bend;
  const cy = (sy + ey) / 2 + perpY * bend;

  // 起点：从控制点方向裁剪到 fromNode 边缘
  const startPt = clipToRectEdge(cx, cy, sx, sy, sx, sy, fw, fh);
  // 终点：从控制点方向裁剪到 toNode 边缘
  const endPt = clipToRectEdge(cx, cy, ex, ey, ex, ey, tw, th);

  return `M ${startPt.x} ${startPt.y} Q ${cx} ${cy} ${endPt.x} ${endPt.y}`;
}

// 计算带拐点的连线路径
function calcConnectionPath(fromNode, toNode, waypoints) {
  if (!waypoints || waypoints.length === 0) {
    return calcCurvePath(fromNode, toNode);
  }

  const fw = fromNode._nodeW || 210;
  const fh = fromNode._nodeH || 52;
  const tw = toNode._nodeW || 210;
  const th = toNode._nodeH || 52;

  // 起点裁剪：fromNode 中心 → 第一个拐点
  const firstWp = waypoints[0];
  const startPt = clipToRectEdge(firstWp.x, firstWp.y, fromNode.x, fromNode.y, fromNode.x, fromNode.y, fw, fh);

  // 终点裁剪：最后一个拐点 → toNode 中心
  const lastWp = waypoints[waypoints.length - 1];
  const endPt = clipToRectEdge(lastWp.x, lastWp.y, toNode.x, toNode.y, toNode.x, toNode.y, tw, th);

  // 构建路径：直线段连接各拐点
  let d = `M ${startPt.x} ${startPt.y}`;
  waypoints.forEach(wp => { d += ` L ${wp.x} ${wp.y}`; });
  d += ` L ${endPt.x} ${endPt.y}`;
  return d;
}

// ===== 保存思维导图数据 =====
function saveMindmapData(course) {
  updateCourse(course.id, {
    mindmapNodePositions: mindmapState.nodePositions,
    mindmapConnections: mindmapState.connections,
    mindmapNodeColors: mindmapState.nodeColors,
  });
}

// 保存当前状态到撤销栈
function pushUndoState(course) {
  const snapshot = {
    connections: JSON.parse(JSON.stringify(mindmapState.connections)),
    nodePositions: JSON.parse(JSON.stringify(mindmapState.nodePositions)),
    nodeColors: JSON.parse(JSON.stringify(mindmapState.nodeColors)),
  };
  mindmapState.undoStack.push(snapshot);
  if (mindmapState.undoStack.length > 50) mindmapState.undoStack.shift();
}

// Ctrl+Z 撤销到上一个状态
function performUndo(course) {
  if (mindmapState.undoStack.length === 0) {
    showToast('没有可撤销的操作', 'info');
    return;
  }
  const prev = mindmapState.undoStack.pop();
  mindmapState.connections = prev.connections;
  mindmapState.nodePositions = prev.nodePositions;
  mindmapState.nodeColors = prev.nodeColors;
  saveMindmapData(course);
  renderMindmap();
  showToast('已撤销 (Ctrl+Z)', 'success');
}

// ===== 交互事件 =====
function bindMindmapEvents(container, svg, course) {
  let isDraggingNode = false;
  let isPanning = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let draggedNode = null;

  function getSvgPoint(e) {
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: e.clientX, y: e.clientY };
    const pt = new DOMPoint(e.clientX, e.clientY);
    const svgP = pt.matrixTransform(ctm.inverse());
    return { x: svgP.x, y: svgP.y };
  }

  function findNodeGroup(el) {
    while (el && el !== svg) {
      if (el.dataset && el.dataset.nodeId) return el;
      el = el.parentElement;
    }
    return null;
  }

  // 更新连线（拖拽时）
  function updateConnectionLines(nodeId, connIdxOverride) {
    // 更新指定连线（拐点拖拽时）或所有与某节点相关的连线
    const conns = mindmapState.connections;
    svg.querySelectorAll('path[data-from][data-to]').forEach(path => {
      const fromId = path.dataset.from;
      const toId = path.dataset.to;
      const idx = parseInt(path.dataset.connIdx);
      if (isNaN(idx)) return;
      // 如果指定了 connIdx，只更新该连线；否则更新与 nodeId 相关的
      if (connIdxOverride !== undefined && idx !== connIdxOverride) return;
      if (connIdxOverride === undefined && nodeId && fromId !== nodeId && toId !== nodeId) return;
      const fromNode = mindmapState.nodes.find(n => n.id === fromId);
      const toNode = mindmapState.nodes.find(n => n.id === toId);
      if (fromNode && toNode && conns[idx]) {
        const waypoints = conns[idx].waypoints || [];
        path.setAttribute('d', calcConnectionPath(fromNode, toNode, waypoints));
      }
    });
    svg.querySelectorAll('text.conn-label').forEach(text => {
      const fromId = text.dataset.from;
      const toId = text.dataset.to;
      if (nodeId && fromId !== nodeId && toId !== nodeId) return;
      const fromNode = mindmapState.nodes.find(n => n.id === fromId);
      const toNode = mindmapState.nodes.find(n => n.id === toId);
      if (fromNode && toNode) {
        const idx = parseInt(text.parentElement?.querySelector('path')?.dataset?.connIdx);
        const waypoints = (idx !== undefined && conns[idx]) ? (conns[idx].waypoints || []) : [];
        const labelWp = waypoints.length > 0 ? waypoints[Math.floor(waypoints.length / 2)] : null;
        text.setAttribute('x', labelWp ? labelWp.x : (fromNode.x + toNode.x) / 2);
        text.setAttribute('y', (labelWp ? labelWp.y : (fromNode.y + toNode.y) / 2) - 12);
      }
    });
  }

  // --- mousedown ---
  svg.addEventListener('mousedown', (e) => {
    // 拐点拖拽
    if (e.target.classList.contains('waypoint-circle') && e.button === 0) {
      e.stopPropagation();
      e.preventDefault();
      const connIdx = parseInt(e.target.dataset.connIdx);
      const wpIdx = parseInt(e.target.dataset.wpIdx);
      const pt = getSvgPoint(e);
      mindmapState.draggingWaypoint = {
        connIdx, wpIdx,
        startX: pt.x,
        startY: pt.y,
        origX: mindmapState.connections[connIdx].waypoints[wpIdx].x,
        origY: mindmapState.connections[connIdx].waypoints[wpIdx].y,
      };
      svg.style.cursor = 'grabbing';
      return;
    }

    const nodeGroup = findNodeGroup(e.target);
    if (nodeGroup && e.button === 0) {
      if (mindmapState.connecting) {
        const targetId = nodeGroup.dataset.nodeId;
        if (targetId !== mindmapState.connecting) {
          const label = prompt('连线关系标签（如：推导自、应用于）：', '') || '';
          pushUndoState(course);
          mindmapState.connections.push({
            from: mindmapState.connecting,
            to: targetId,
            label: label,
            waypoints: mindmapState.tempWaypoints.length > 0 ? [...mindmapState.tempWaypoints] : [],
          });
          saveMindmapData(course);
        }
        mindmapState.connecting = null;
        mindmapState.tempWaypoints = [];
        svg.style.cursor = 'grab';
        renderMindmap();
        return;
      }

      pushUndoState(course);
      isDraggingNode = true;
      draggedNode = mindmapState.nodes.find(n => n.id === nodeGroup.dataset.nodeId);
      if (draggedNode) {
        const pt = getSvgPoint(e);
        mindmapState.dragOffset = { x: pt.x - draggedNode.x, y: pt.y - draggedNode.y };
      }
      svg.style.cursor = 'grabbing';
      e.preventDefault();
    } else if (e.button === 0) {
      // 连线模式下点击空白 → 添加拐点
      if (mindmapState.connecting) {
        const pt = getSvgPoint(e);
        mindmapState.tempWaypoints.push({ x: Math.round(pt.x), y: Math.round(pt.y) });
        renderMindmap();
        showToast(`拐点 ${mindmapState.tempWaypoints.length} 已添加，继续点击空白添加更多拐点，或点击目标节点完成`, 'info');
        return;
      }
      isPanning = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      svg.style.cursor = 'grabbing';
    }
  });

  // --- mousemove ---
  svg.addEventListener('mousemove', (e) => {
    // 拖拽拐点
    if (mindmapState.draggingWaypoint) {
      const dw = mindmapState.draggingWaypoint;
      const pt = getSvgPoint(e);
      const dx = pt.x - dw.startX;
      const dy = pt.y - dw.startY;
      const wp = mindmapState.connections[dw.connIdx].waypoints[dw.wpIdx];
      wp.x = dw.origX + dx;
      wp.y = dw.origY + dy;
      // 更新拐点圆点位置
      const circle = svg.querySelector(`circle[data-conn-idx="${dw.connIdx}"][data-wp-idx="${dw.wpIdx}"]`);
      if (circle) {
        circle.setAttribute('cx', wp.x);
        circle.setAttribute('cy', wp.y);
      }
      // 更新路径
      updateConnectionLines(null, dw.connIdx);
      return;
    }
    if (isDraggingNode && draggedNode) {
      const pt = getSvgPoint(e);
      draggedNode.x = pt.x - mindmapState.dragOffset.x;
      draggedNode.y = pt.y - mindmapState.dragOffset.y;

      const nodeGroup = svg.querySelector(`g[data-node-id="${draggedNode.id}"]`);
      if (nodeGroup) {
        nodeGroup.setAttribute('transform', `translate(${draggedNode.x}, ${draggedNode.y})`);
      }
      updateConnectionLines(draggedNode.id);
    } else if (isPanning) {
      const factor = mindmapState.viewBox.w / container.clientWidth;
      mindmapState.viewBox.x -= (e.clientX - lastMouseX) * factor;
      mindmapState.viewBox.y -= (e.clientY - lastMouseY) * factor;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      svg.setAttribute('viewBox', `${mindmapState.viewBox.x} ${mindmapState.viewBox.y} ${mindmapState.viewBox.w} ${mindmapState.viewBox.h}`);
    } else if (mindmapState.connecting) {
      // 连线创建中：显示预览路径
      const pt = getSvgPoint(e);
      const fromNode = mindmapState.nodes.find(n => n.id === mindmapState.connecting);
      if (fromNode) {
        let previewD;
        if (mindmapState.tempWaypoints.length > 0) {
          const allPts = [...mindmapState.tempWaypoints, { x: pt.x, y: pt.y }];
          let d = `M ${fromNode.x} ${fromNode.y}`;
          allPts.forEach(p => { d += ` L ${p.x} ${p.y}`; });
          previewD = d;
        } else {
          previewD = `M ${fromNode.x} ${fromNode.y} L ${pt.x} ${pt.y}`;
        }
        if (!mindmapState.previewPath) {
          mindmapState.previewPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          mindmapState.previewPath.setAttribute('stroke', '#c4958b');
          mindmapState.previewPath.setAttribute('stroke-dasharray', '6 3');
          mindmapState.previewPath.setAttribute('stroke-width', '1.5');
          mindmapState.previewPath.setAttribute('fill', 'none');
          mindmapState.previewPath.style.pointerEvents = 'none';
          svg.appendChild(mindmapState.previewPath);
        }
        mindmapState.previewPath.setAttribute('d', previewD);
      }
    }
  });

  // --- mouseup ---
  window.addEventListener('mouseup', () => {
    if (mindmapState.draggingWaypoint) {
      saveMindmapData(course);
      mindmapState.draggingWaypoint = null;
      svg.style.cursor = 'grab';
      renderMindmap();
      return;
    }
    if (isDraggingNode && draggedNode) {
      course.mindmapNodePositions[draggedNode.id] = { x: draggedNode.x, y: draggedNode.y };
      saveMindmapData(course);
      draggedNode = null;
    }
    isDraggingNode = false;
    isPanning = false;
    svg.style.cursor = mindmapState.connecting ? 'crosshair' : 'grab';
  });

  // --- 双击连线 ---
  svg.addEventListener('dblclick', (e) => {
    const nodeGroup = findNodeGroup(e.target);
    if (!nodeGroup) return;
    const nodeId = nodeGroup.dataset.nodeId;
    if (mindmapState.connecting) {
      mindmapState.connecting = null;
      mindmapState.tempWaypoints = [];
      svg.style.cursor = 'grab';
      renderMindmap();
      showToast('已取消连线模式', 'info');
    } else if (mindmapState.nodes.length > 1) {
      mindmapState.connecting = nodeId;
      mindmapState.tempWaypoints = [];
      svg.style.cursor = 'crosshair';
      renderMindmap();
      showToast('点击空白添加拐点，点击目标节点完成连线', 'info');
    }
  });

  // --- 右键菜单：删除节点 / 更改颜色 ---
  svg.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    // 右键拐点 → 删除拐点
    if (e.target.classList.contains('waypoint-circle')) {
      const connIdx = parseInt(e.target.dataset.connIdx);
      const wpIdx = parseInt(e.target.dataset.wpIdx);
      if (!isNaN(connIdx) && !isNaN(wpIdx) && mindmapState.connections[connIdx]) {
        if (confirm('删除此拐点？')) {
          pushUndoState(course);
          mindmapState.connections[connIdx].waypoints.splice(wpIdx, 1);
          if (mindmapState.connections[connIdx].waypoints.length === 0) {
            delete mindmapState.connections[connIdx].waypoints;
          }
          saveMindmapData(course);
          renderMindmap();
        }
      }
      return;
    }

    const nodeGroup = findNodeGroup(e.target);

    if (nodeGroup) {
      const nodeId = nodeGroup.dataset.nodeId;
      const node = mindmapState.nodes.find(n => n.id === nodeId);
      if (!node) return;

      const action = prompt(
        `节点「${node.name}」\n\n` +
        '输入数字选择操作：\n' +
        '1 — 更改颜色\n' +
        '2 — 从导图中隐藏\n' +
        '其他 — 取消',
        ''
      );

      if (action === '1') {
        showColorPicker(node, course);
      } else if (action === '2') {
        if (confirm(`确定隐藏节点「${node.name}」？\n\n该概念将设为「不在思维导图中显示」，可在概念编辑中重新开启。`)) {
          pushUndoState(course);
          // 设置概念的 showInMindmap 为 false
          (course.chapters || []).forEach(ch => {
            (ch.concepts || []).forEach(c => {
              if (c.id === nodeId) c.showInMindmap = false;
            });
          });
          updateCourse(course.id, { chapters: course.chapters });
          // 清理该节点的连线和位置
          mindmapState.connections = mindmapState.connections.filter(
            con => con.from !== nodeId && con.to !== nodeId
          );
          delete mindmapState.nodePositions[nodeId];
          delete mindmapState.nodeColors[nodeId];
          saveMindmapData(course);
          renderMindmapView();
          showToast(`「${node.name}」已从思维导图隐藏`, 'success');
        }
      }
    } else if (e.target.dataset && e.target.dataset.from) {
      if (confirm('删除此连线？')) {
        pushUndoState(course);
        mindmapState.connections = mindmapState.connections.filter(
          c => !(c.from === e.target.dataset.from && c.to === e.target.dataset.to)
        );
        saveMindmapData(course);
        renderMindmap();
      }
    }
  });

  // --- 滚轮缩放 ---
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const scale = e.deltaY > 0 ? 1.12 : 0.89;
    const cx = mindmapState.viewBox.x + mindmapState.viewBox.w / 2;
    const cy = mindmapState.viewBox.y + mindmapState.viewBox.h / 2;
    mindmapState.viewBox.w = Math.max(200, Math.min(10000, mindmapState.viewBox.w * scale));
    mindmapState.viewBox.h = Math.max(150, Math.min(7500, mindmapState.viewBox.h * scale));
    mindmapState.viewBox.x = cx - mindmapState.viewBox.w / 2;
    mindmapState.viewBox.y = cy - mindmapState.viewBox.h / 2;
    svg.setAttribute('viewBox', `${mindmapState.viewBox.x} ${mindmapState.viewBox.y} ${mindmapState.viewBox.w} ${mindmapState.viewBox.h}`);
  });

  // --- 点击空白取消选中 ---
  svg.addEventListener('click', (e) => {
    if (e.target === svg && mindmapState.selectedConnection !== null) {
      mindmapState.selectedConnection = null;
      renderMindmap();
    }
  });

  // --- 键盘快捷键 ---
  document.addEventListener('keydown', function onKey(e) {
    // Ctrl+Z 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      if (mindmapState.courseId) {
        e.preventDefault();
        const course = getCourseById(mindmapState.courseId);
        if (course) performUndo(course);
      }
      return;
    }
    // Delete 删除选中连线
    if ((e.key === 'Delete' || e.key === 'Backspace') && mindmapState.selectedConnection !== null) {
      if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
      e.preventDefault();
      const course = getCourseById(mindmapState.courseId);
      if (course) {
        pushUndoState(course);
        mindmapState.connections.splice(mindmapState.selectedConnection, 1);
        mindmapState.selectedConnection = null;
        saveMindmapData(course);
        renderMindmap();
        showToast('连线已删除', 'success');
      }
      return;
    }
    // ESC 取消连线模式 / 取消选中
    if (e.key === 'Escape') {
      if (mindmapState.connecting) {
        mindmapState.connecting = null;
        mindmapState.tempWaypoints = [];
        if (mindmapState.previewPath) {
          mindmapState.previewPath.remove();
          mindmapState.previewPath = null;
        }
        svg.style.cursor = 'grab';
        renderMindmap();
        showToast('已取消连线模式', 'info');
      } else if (mindmapState.selectedConnection !== null) {
        mindmapState.selectedConnection = null;
        renderMindmap();
      }
    }
  });
}

// ===== 颜色选择弹窗 =====
function showColorPicker(node, course) {
  const nodeId = node.id;
  const currentColor = mindmapState.nodeColors[nodeId] || '#8a9b9e';

  const bodyHtml = `
    <div style="text-align:center;">
      <p style="margin-bottom:12px;font-size:13px;color:var(--ink-light);">为「${escapeHtml(node.name)}」选择颜色</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
        ${NODE_COLORS.map(c => `
          <div class="mindmap-color-option" data-color="${c}"
               style="width:36px;height:36px;border-radius:50%;background:${c};cursor:pointer;
                      border:3px solid ${c === currentColor ? 'var(--ink)' : 'transparent'};
                      transition:all 0.15s ease;"
               onmouseover="this.style.transform='scale(1.2)'"
               onmouseout="this.style.transform='scale(1)'">
          </div>
        `).join('')}
      </div>
    </div>`;

  showModal('更改节点颜色', bodyHtml, () => {
    // 颜色在点击时即时生效，确认按钮仅关闭弹窗
  }, (overlay) => {
    overlay.querySelectorAll('.mindmap-color-option').forEach(opt => {
      opt.addEventListener('click', function() {
        const c = this.dataset.color;
        pushUndoState(course);
        mindmapState.nodeColors[nodeId] = c;
        saveMindmapData(course);
        closeAllModals();
        renderMindmap();
        showToast('颜色已更新', 'success');
      });
    });
  });
}
