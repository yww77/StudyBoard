# StudyBoard — 新对话交接文档

## 怎么用这个文档

1. **打开新 Claude Code 对话**
2. **把这份 HANDOFF.md 的内容粘贴给 Claude**（或告诉 Claude 阅读此文件）
3. **说清楚你要继续做什么**（比如"继续修复思维导图节点大小"）
4. Claude 就可以直接读取 `src/` 下所有文件并继续工作

---

## 项目概览

**StudyBoard** — 纯前端学习复习网站。浏览器打开 `src/index.html` 即可使用，所有数据存 localStorage。

### 技术栈

| 项目 | 方案 |
|------|------|
| 架构 | 纯 HTML + CSS + JavaScript（无框架、无构建工具） |
| 公式渲染 | KaTeX CDN（jsdelivr） |
| 思维导图 | 自定义 SVG + `foreignObject` 嵌入 KaTeX HTML |
| 数据存储 | localStorage + JSON 导出/导入 |
| 图片/PDF | FileReader → Base64 存入 localStorage |
| UI | 蓝色主题 + 左侧边栏 + 顶部标签切换 |

### 用户背景

用户是编程初学者（仅基础 C/C++），需要详细的步骤说明。

---

## 目录结构

```
C:\Users\ASUS\Desktop\vs_code\vsCode_test\
├── CLAUDE.md                # 项目指引（给 Claude 看的）
├── HANDOFF.md               # 本文件（新对话交接用）
├── devlog/
│   └── 2026-05-20.md        # 开发日志
├── src/
│   ├── index.html           # 主页面入口
│   ├── css/
│   │   └── styles.css       # 全局样式
│   └── js/
│       ├── app.js           # 入口、路由、AppState、Modal
│       ├── storage.js       # localStorage 读写 + 导出/导入 JSON
│       ├── courses.js       # 课程 CRUD + 侧边栏渲染
│       ├── chapters.js      # 章节 CRUD + 章节视图渲染
│       ├── concepts.js      # 概念 + 推导区块 + KaTeX 公式预览
│       ├── examples.js      # 例题模块 + tag + 搜索 + 图片/PDF 上传
│       ├── latexRef.js      # LaTeX 公式参考库（分类浏览 + 点击复制）
│       ├── mindmap.js       # SVG 思维导图（拖拽节点 + 曲线箭头连线）
│       ├── formulaBar.js    # 公式符号快捷插入工具栏
│       └── utils.js         # 工具函数
```

---

## 每个文件的作用和核心逻辑

### `src/index.html`（主页面）

- 侧边栏 `#sidebar`（课程列表 + 新建课程按钮 + 导出/导入/清空数据按钮）
- 顶部导航栏 `#topbar`（4 个标签：课程 / 例题库 / 思维导图 / 公式参考）
- 主内容区 `#content`
- 弹窗容器 `#modalContainer`
- KaTeX CDN 通过 jsdelivr 加载（`<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js">`）
- JS 文件按顺序加载：utils.js → storage.js → courses.js → chapters.js → concepts.js → examples.js → latexRef.js → mindmap.js → formulaBar.js → app.js
- 重要：KaTeX 加载完成后 `window.katex` 全局可用，所有模块通过 `typeof katex === 'undefined'` 做安全检查

### `src/css/styles.css`（样式）

- CSS 变量系统（蓝色主题）：`--blue-50` 到 `--blue-800`，灰色色阶，语义颜色（红/绿/黄），圆角、阴影、过渡
- 布局：`#app` flex 容器，`#sidebar` 240px 固定宽度，`#main` 自适应
- 组件样式：`.card`、`.btn`（primary/secondary/danger/sm/icon）、`.modal-overlay`/`.modal`、`.form-group`/`.form-input`/`.form-textarea`、`.tag`、`.search-bar`、`.toast`、`.breadcrumb`、`.concept-card`、`.derivation-block`、`.formula-preview`、`.latex-ref-layout` 等
- 768px 响应式断点

### `src/js/utils.js`（工具函数）

- `generateId()` — 时间戳+随机数生成唯一 ID
- `todayStr()` — 返回 YYYY-MM-DD 格式日期
- `debounce(fn, delay)` — 防抖函数
- `escapeHtml(str)` — HTML 转义（防 XSS）
- `el(tag, attrs, ...children)` — DOM 创建辅助（较少使用）
- `showToast(message, type)` — 右上角 Toast 提示（success/error/info）

### `src/js/app.js`（应用入口）

- `AppState` 全局状态对象：`currentTab`、`currentCourseId`、`currentChapterId`
- `DOM` 缓存常用 DOM 元素引用
- `switchTab(tabName)` — 路由函数，根据 tab 名称调用对应模块的渲染函数（用 `typeof` 检查模块是否加载）
- `showModal(title, bodyHtml, onSave)` — 创建弹窗，有保存/取消按钮，ESC 关闭，点击遮罩关闭
- `closeAllModals()` — 关闭所有弹窗
- `refreshSidebarCourses()` — 刷新侧边栏课程列表
- `bindEvents()` — 绑定顶部标签点击、新建课程按钮、导出/导入/清空数据按钮
- `init()` — DOMContentLoaded 时执行初始化

### `src/js/storage.js`（数据层）

- localStorage key：`'sb_courses'`、`'sb_examples'`
- 课程 CRUD：`getCourses()`, `saveCourses()`, `getCourseById()`, `addCourse()`, `updateCourse()`, `deleteCourse()`（删除课程时同步删除关联例题）
- 例题 CRUD：`getExamples()`, `saveExamples()`, `getExamplesByCourse()`, `addExample()`, `updateExample()`, `deleteExample()`
- `exportData()` — 全部数据导出为 JSON 文件下载
- `importData(file)` — 读取 JSON 文件，解析后合并（按 id 去重），刷新页面
- `initStorage()` — 确保 localStorage 中有初始空数组

### `src/js/courses.js`（课程管理 UI）

- `renderSidebarCourses()` — 侧边栏课程列表（带颜色圆点、高亮当前课程）
- `renderCourseView()` — 课程网格卡片视图 OR 委托给 `renderChapterView()`（如果已选中课程）
- `showNewCourseModal()` — 新建课程弹窗（名称 + 8 色选择器）
- `showRenameCourseModal(course)` — 重命名弹窗
- 点击课程卡片 → 设置 `AppState.currentCourseId` → 重新渲染

### `src/js/chapters.js`（章节管理）

- `showNewChapterModal(course)` — 新建章节
- `renderChapterView(course)` — 章节列表视图：
  - 面包屑导航（课程名 > 章节列表）
  - 章节按 `order` 排序，上移/下移按钮（边界禁用）
  - 章节重命名/删除
  - 概念卡片渲染（委托给 `concepts.js` 的 `renderConceptsInChapter()`）
  - 快捷操作按钮（跳转例题/思维导图）
- `showRenameChapterModal(course, chapter)`
- `bindConceptCardEvents(content)` — 概念卡片事件绑定

### `src/js/concepts.js`（概念 + 推导区块 + 公式预览）★核心模块

- `showConceptModal(chapterId, existingConcept)` — 新建/编辑概念弹窗：
  - 名称输入框
  - 文字描述 textarea
  - 公式输入框（LaTeX 语法）+ KaTeX 实时预览（`safeRender()` + `debounce(300ms)`）
  - 推导区块系统：
    - 默认 3 个区块：Bemerkung / Beweis / 意义/运用
    - 每个区块可单独删除
    - 「添加区块」按钮 → `prompt()` 输入自定义标题 → 新增区块
    - 每个区块有标题 + 内容 textarea（支持 LaTeX）
  - 保存时收集所有区块数据，写入 `course.chapters[].concepts[]`
- `safeRender(latex, target)` — 安全检查：KaTeX 未加载显示黄色警告，语法错误显示红色提示
- `renderConceptsInChapter(chapter)` — 概念卡片 HTML（标题 + 公式指示器 + 描述 + 推导区块）
- `renderConceptFormulas(container)` — 对卡片中的 `.concept-formula-render` 和 `.block-formula-render` 进行 KaTeX 渲染
- `renderMixedLatex(text)` — 混合文本与 LaTeX 渲染：
  - 自动检测纯 LaTeX（含 `\frac` 等命令但无 `$` 分隔符）→ 自动包裹 `$$`
  - 处理 `$$...$$` 和 `$...$` 分隔符
  - 普通文本 escape 处理
- `bindConceptCardEvents(container)` — 卡片展开/折叠、编辑/删除按钮

### `src/js/examples.js`（例题模块）

- `renderExampleView()` — 例题库主视图：
  - 顶部工具栏：搜索输入框 + 课程筛选下拉
  - 例题卡片网格 `#exampleResults`
- `renderExampleCard(example)` — 例题卡片：
  - `stripLatex()` 去除 LaTeX 语法后的纯文本预览（最多 150 字符）
  - Tag 标签（可点击筛选）
  - 图片缩略图（最多 3 张）
  - 附件统计
- `bindExampleCardEvents()` — 编辑/删除、tag 点击 → 设搜索词 → `refreshExampleResults()`
- `showExampleDetailModal(example)` — 例题详情弹窗（题目/解题思路用 `renderMixedLatex` 渲染，附件展示）
- `showExampleModal(existingExample)` — 新建/编辑例题弹窗：
  - 所属课程选择
  - 标题、题目内容（LaTeX）、解题思路
  - 文件上传：图片 + PDF（FileReader → Base64）
  - Tag 输入：Enter / 逗号 / 失焦 确认，去重检查
- `stripLatex(text)` — 移除 `$...$`、`$$...$$`、`\commands`、`{}` 括号，用于纯文本预览
- `openPdf(dataUrl, filename)` — PDF 在新窗口用 iframe 打开 + 下载链接
- `refreshFilePreview(images, pdfs)` — 渲染文件预览（图片缩略图 + PDF 图标）
- `refreshExampleResults()` — 局部刷新例题结果（不重建搜索输入框，解决输入卡顿问题）
  - 按 `searchQuery` 精确匹配 tag（`tag.toLowerCase() === query`）
  - 按 `courseId` 筛选
- `getRelatedExamplesByTag(tags)` — 跨模块函数，供概念详情页获取关联例题

### `src/js/latexRef.js`（LaTeX 公式参考库）

- `LATEX_CATEGORIES` 数组 — 9 个分类共 150+ 符号：
  - 希腊字母（34）、微积分（18）、线性代数（14）、复数（9）、集合与逻辑（20）、函数与运算符（16）、关系与符号（20）、箭头（10）、装饰与标注（16）
- `renderLatexRefView()` — 左右布局：左侧分类列表 + 右侧表格（说明 / LaTeX 代码 / 渲染效果）
- 点击行 → 复制 LaTeX 代码到剪贴板（`navigator.clipboard` + `fallbackCopy` 兜底）
- 分类切换用 `latexRefActiveCategory` 变量

### `src/js/mindmap.js`（思维导图）★已基本完成但节点大小需修复

- `mindmapState` 全局状态：svg 引用、courseId、nodes 数组、connections 数组、nodePositions、nodeColors、dragging、connecting、viewBox
- `NODE_COLORS` — 10 种颜色可选
- `renderMindmapView()` — 思维导图主视图：
  - 课程选择下拉框
  - 图例 + 操作提示
  - SVG 画布初始化
  - 从课程数据加载概念 → nodes（含 name、formula、description）
  - 自动初始化新概念的位置（网格排列 + 随机偏移）和颜色
  - 加载保存的连线 `course.mindmapConnections`
  - 调用 `renderMindmap()` + `bindMindmapEvents()`
- `renderMindmap()` — 核心渲染：
  - 连线：`<path>` 贝塞尔曲线（`Q` 命令），带箭头 marker，中间显示关系标签
    - **BUG待修复**：`nodeW` 已改为 210，但 `nodeH` 仍是固定值 `node.formula ? 82 : 52`，未改为动态计算
    - **BUG待修复**：节点内部文字仍有 `white-space:nowrap`、`text-overflow:ellipsis`、`overflow:hidden`，导致内容被截断
  - 节点：`<g>` 包含 `<rect>` 背景 + 颜色条 + `<foreignObject>`（HTML div 内嵌概念名、KaTeX 渲染公式、描述）
    - `foreignObject` 让 SVG 可以嵌入 HTML，从而在 SVG 内使用 KaTeX 渲染
- `calcCurvePath(fromNode, toNode)` — 二次贝塞尔曲线计算（垂直偏移量最大 60px）
- `saveMindmapData(course)` — 保存节点位置、连线、颜色到 course 数据
- `bindMindmapEvents(container, svg, course)` — 交互事件：
  - mousedown：拖拽节点 OR 完成连线（connecting 模式下）OR 开始平移画布
  - mousemove：实时移动节点（直接操作 DOM）+ 更新连线 OR 平移画布
  - mouseup：保存节点位置
  - dblclick：进入/取消连线模式（第一个双击的节点=起点，点击目标=终点）
  - contextmenu：右键菜单（更改颜色 / 隐藏节点 / 删除连线）
  - wheel：滚轮缩放（以画布中心为基准）
  - ESC：取消连线模式
- `showColorPicker(node, course)` — 颜色选择弹窗（10 色圆圈，点击即改）

### `src/js/formulaBar.js`（公式快捷工具栏）

- `FORMULA_GROUPS` — 4 组符号：微积分、希腊字母、结构、符号
- `renderFormulaToolbar(targetInputId)` — 生成工具栏 HTML
- `bindFormulaButtons(container)` — 点击按钮 → `insertAtCursor()` 插入 LaTeX 代码
- `insertAtCursor(textarea, text)` — 在光标处插入文本，恢复光标位置，触发 `input` 事件（使 KaTeX 预览更新）

---

## 数据模型

```javascript
// localStorage key: 'sb_courses'
courses: [
  {
    id: "1716123456789_abc123",
    name: "数学分析",
    color: "#3b82f6",
    createdAt: "2026-05-20",
    chapters: [
      {
        id: "1716123456790_def456",
        title: "极限与连续",
        order: 0,
        concepts: [
          {
            id: "1716123456791_ghi789",
            name: "极限的定义",
            description: "函数极限的 epsilon-delta 定义",
            formula: "\\lim_{x \\to a} f(x) = L",
            derivationBlocks: [
              { id: "...", title: "Bemerkung", content: "..." },
              { id: "...", title: "Beweis", content: "..." },
              { id: "...", title: "意义/运用", content: "..." }
            ]
          }
        ]
      }
    ],
    mindmapConnections: [
      { from: "conceptId1", to: "conceptId2", label: "推导自" }
    ],
    mindmapNodePositions: {
      "conceptId1": { x: 120, y: 80 }
    },
    mindmapNodeColors: {
      "conceptId1": "#3b82f6"
    }
  }
]

// localStorage key: 'sb_examples'
examples: [
  {
    id: "...",
    title: "例题标题",
    content: "题目内容（支持 LaTeX）",
    solution: "解题思路（支持 LaTeX）",
    tags: ["极限", "连续"],
    images: ["data:image/png;base64,..."],
    pdfs: ["data:application/pdf;base64,..."],
    courseId: "courseId"
  }
]
```

---

## 已完成进度（8 个阶段）

| 阶段 | 内容 | 状态 |
|------|------|------|
| 1 | 项目框架（index.html + styles.css + app.js + utils.js） | ✅ 完成 |
| 2 | 课程管理（storage.js + courses.js） | ✅ 完成 |
| 3 | 章节管理（chapters.js — CRUD + 排序） | ✅ 完成 |
| 4 | 概念 & 推导区块（concepts.js + formulaBar.js — KaTeX预览 + 自定义区块） | ✅ 完成 |
| 5 | 例题模块（examples.js — tag + 搜索 + 图片/PDF上传） | ✅ 完成 |
| 6 | LaTeX 公式参考库（latexRef.js — 9分类150+符号 + 点击复制） | ✅ 完成 |
| 7 | 思维导图（mindmap.js — SVG + foreignObject + 拖拽 + 曲线连线 + 颜色 + 缩放） | ⚠️ 基本完成，但节点大小需修复 |
| 8 | 导出/导入 & 收尾优化 | ❌ 待做 |

---

## 当前待办事项（详细）

### 待办 1：修复思维导图节点大小问题 ★ 当前正在做

**文件**：`src/js/mindmap.js`

**问题**：节点使用固定尺寸，文字被 `white-space:nowrap` + `text-overflow:ellipsis` + `overflow:hidden` 截断。

**已完成的部分修改**：`nodeW` 已从 175 改为 210（第 184 行）

**仍需修改的位置**：

1. **第 185 行** — `nodeH` 需要从固定值改为动态计算：
   ```
   当前：const nodeH = node.formula ? 82 : 52;
   需要：根据 name、formula、description 的文本长度估算行数，动态计算高度
   ```

2. **第 227 行** — formula 渲染的 style 需要改为：
   ```
   当前：style="...overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:150px;"
   需要：style="...word-wrap:break-word;overflow-wrap:break-word;"（移除截断样式）
   ```

3. **第 229 行** — formula 错误时的截断需移除：
   ```
   当前：escapeHtml(node.formula.substring(0, 40))
   需要：escapeHtml(node.formula)（显示完整公式文本）
   ```

4. **第 234 行** — fo.innerHTML 的外层 div style 需要改为：
   ```
   当前：overflow:hidden;height:100%;...
   需要：移除 overflow:hidden，改为 word-wrap:break-word;overflow-wrap:break-word;
   ```

5. **第 235 行** — 名称 div 需要改为：
   ```
   当前：overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
   需要：word-wrap:break-word;（允许换行）
   ```

6. **第 237 行** — 描述 div 需要改为：
   ```
   当前：overflow:hidden;text-overflow:ellipsis;white-space:nowrap; + substring(0, 50)
   需要：word-wrap:break-word;（允许换行）+ 显示完整描述
   ```

**实现思路**：在 `nodes.forEach` 内添加一个 `estimateTextHeight(text, fontSize, maxWidth)` 辅助函数，基于字符宽度估算（中文字符 ≈ fontSize px，拉丁字符 ≈ fontSize×0.55 px），计算所需行数，累加得到 `nodeH`。

### 待办 2：阶段 8 — 导出/导入 & 收尾优化

**文件**：`src/js/storage.js`（导出/导入函数已存在）、`src/js/app.js`、`src/js/formulaBar.js`

1. **导出/导入功能已编码**（`exportData()` / `importData()` 在 storage.js），但需确认 UI 按钮已正确绑定（在 app.js 的 `bindEvents()` 中）
2. **公式快捷工具栏集成**：`formulaBar.js` 已编码但需要在概念编辑弹窗的公式 textarea 旁边显示
3. **清空数据按钮**：需要在 UI 中添加，含二次确认弹窗
4. **最终 UI 打磨**：检查各视图的空状态提示、间距、文字一致性

---

## 如何在新对话中继续

### 方法 1：直接粘贴 HANDOFF.md（推荐）

1. 打开新的 Claude Code 对话
2. 输入以下内容：
   ```
   我正在做一个名为 StudyBoard 的纯前端学习复习网站。
   项目在 C:\Users\ASUS\Desktop\vs_code\vsCode_test\
   
   请先阅读以下文件了解项目全貌：
   1. CLAUDE.md — 项目指引
   2. HANDOFF.md — 交接文档（包含全部进度和待办）
   3. src/js/mindmap.js — 思维导图模块（当前有 bug 需要修复）
   
   然后帮我继续 [你的具体需求]
   ```
3. Claude 会自动读取相关文件并继续工作

### 方法 2：让 Claude 自己探索

1. 打开新对话
2. 输入：
   ```
   请阅读 C:\Users\ASUS\Desktop\vs_code\vsCode_test\ 下的 CLAUDE.md 和 HANDOFF.md，
   了解项目状态后告诉我你理解的情况，然后我们继续开发。
   ```

### 方法 3：直接说任务（最快）

1. 新对话中直接说：
   ```
   继续修复 C:\Users\ASUS\Desktop\vs_code\vsCode_test\src\js\mindmap.js 中的思维导图节点大小问题。
   当前节点使用固定尺寸导致内容被截断。请先读取 mindmap.js 然后修复，让节点能显示完整内容。
   ```

### 重要提示

- 这个项目**不是 git 仓库**，没有版本控制
- 浏览器打开 `src/index.html` 即可测试（无需服务器）
- KaTeX 通过 jsdelivr CDN 加载，需要网络连接
- 所有数据存在 localStorage，F12 → Application → Local Storage 可查看
- 开发日志在 `devlog/2026-05-20.md`
- 开发原则：一次只改一个文件，遇到报错立即停止，每阶段完成后更新 devlog
