# StudyBoard 网页重构与开发规范 (UI Handoff Spec)

## 一、 核心设计目标 (Design Goal)

将当前网页由"现代、扁平、高饱和度"的初级 AI 风格，全面重构为**美式复古杂志/报纸风 (American Retro Magazine/Newspaper Style)**。强调高对比度、印刷感、手绘细节与呼吸感。

---

## 二、 新配色体系 (Color Palette)

> 替换旧有的莫兰迪色系（dusty-blue / dusty-rose / warm-gray），建立以**豆沙粉 + 灰蓝 + 鼠尾草绿**为辅助色的新调色板。配色灵感来自美式复古报纸/杂志的温暖印刷色调。

### 纸张色 (Paper Tones — 背景体系)

| 变量 | 色值 | 用途 |
|------|------|------|
| `--paper` | `#f4eee4` | 页面主背景（暖奶油报纸色） |
| `--paper-card` | `#faf7f2` | 卡片表面色 |
| `--paper-white` | `#fefdfb` | 最亮表面（弹窗、输入框背景） |
| `--paper-dark` | `#e8e1d4` | 侧边栏、次区域背景 |
| `--paper-border` | `#d6cec2` | 柔和分割线 |

### 墨色 (Ink Tones — 文字与强线条)

> 使用暖调炭黑而非纯黑，呼应旧印刷品的油墨质感

| 变量 | 色值 | 用途 |
|------|------|------|
| `--ink` | `#2c241c` | 主文字、实线边框、硬阴影 |
| `--ink-light` | `#5c5650` | 次要文字 |
| `--ink-muted` | `#8c8680` | 占位符、极弱文字 |

### 辅色 — 豆沙粉 (Dusty Rose, 主强调色)

> 低饱和度粉棕，温暖柔和，用于主按钮、链接、活跃状态、高亮

| 变量 | 色值 | 用途 |
|------|------|------|
| `--rose` | `#c49b8b` | 主色 |
| `--rose-hover` | `#b5897a` | hover 加深 |
| `--rose-light` | `#f0e8e4` | 浅色边框 |
| `--rose-bg` | `#f6efeb` | 极浅背景 |

### 辅色 — 灰蓝 (Slate Blue, 次强调色)

> 低饱和度蓝灰，冷静克制，用于次按钮、标签、信息提示

| 变量 | 色值 | 用途 |
|------|------|------|
| `--slate` | `#82919e` | 主色 |
| `--slate-hover` | `#72818e` | hover 加深 |
| `--slate-light` | `#e4e8eb` | 浅色边框 |
| `--slate-bg` | `#eef1f3` | 极浅背景 |

### 辅色 — 鼠尾草绿 (Sage Green, 第三强调色)

> 低饱和度灰绿，自然柔和，用于特殊高亮、分类标记、思维导图节点

| 变量 | 色值 | 用途 |
|------|------|------|
| `--sage` | `#96a592` | 主色 |
| `--sage-hover` | `#859481` | hover 加深 |
| `--sage-light` | `#e8ede6` | 浅色边框 |
| `--sage-bg` | `#eef2ec` | 极浅背景 |

### 语义色

| 变量 | 色值 | 用途 |
|------|------|------|
| `--danger` | `#b85450` | 删除/危险操作 |
| `--danger-bg` | `#fce8e6` | 危险操作背景 |
| `--success` | `#5a7d5a` | 成功状态 |
| `--success-bg` | `#e8f0e8` | 成功状态背景 |

### 硬阴影 (Hard Shadow — 核心视觉特征)

| 变量 | 色值 | 用途 |
|------|------|------|
| `--shadow` | `4px 4px 0 var(--ink)` | 标准硬阴影（卡片、按钮） |
| `--shadow-sm` | `2px 2px 0 var(--ink)` | 小型硬阴影（小按钮、标签） |

### 布局与排版

| 变量 | 值 | 说明 |
|------|-----|------|
| `--sidebar-width` | `260px` | 侧边栏宽度 |
| `--topbar-height` | `56px` | 顶栏高度 |
| `--radius` | `2px` | 默认微圆角 |
| `--radius-sm` | `4px` | 略大圆角（仅特殊场合） |
| `--transition` | `0.15s ease` | 过渡时间 |
| `--font-display` | `'Playfair Display', Georgia, 'Times New Roman', serif` | 大标题衬线体 |
| `--font-body` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', 'Microsoft YaHei', sans-serif` | 正文无衬线体 |
| `--font-mono` | `'Consolas', 'Courier New', monospace` | 代码/公式等宽体 |

---

## 三、 视觉与 UI 规范 (UI Specifications)

### 1. 字体与层级 (Typography)
- **大标题与目录：** 必须使用 `var(--font-display)` 粗体衬线体。侧边栏品牌名（StudyBoard）和主目录标题，需呈现**旧报纸/旧杂志头版大标题**的视觉冲击力。
- **正文：** 使用 `var(--font-body)` 高可读性无衬线体。
- **公式/代码：** 使用 `var(--font-mono)`。

### 2. 色彩与对比度 (Colors & Contrast)
- **主背景：** `--paper` 浅米色/报纸黄。
- **文字：** 正文使用 `--ink` (`#2c241c` 暖调炭黑)，**大幅提升对比度**。
- **边框与线条：** 统一使用 `--ink` 纯黑实线（1px 或 2px），禁止使用浅灰色虚线/点线边框。
- **辅助色：** 仅使用豆沙粉、灰蓝、鼠尾草绿的低饱和度复古调色板。

### 3. 组件与边框 (Components & Borders)
- **圆角：** 彻底抛弃现有的胶囊状大圆角（14px/10px 等）。所有按钮、卡片、输入框改为 `2px` 或 `4px` 微圆角。
- **边框：** 所有卡片和核心按钮必须带有 `1px` 或 `2px` 的纯黑实线边框 (`border: 2px solid var(--ink)`)。
- **阴影：** 禁止使用模糊渐变阴影。**必须使用硬阴影**（`box-shadow: var(--shadow)` 或 `var(--shadow-sm)`），即以 `--ink` 暖炭色为投影色、无模糊、带位移的硬色块。
- **布局：** 扩大中央内容区卡片展示空间，增加 Padding（≥24px）和 Margin（≥20px），增强页面呼吸感。

### 4. 图标风格 (Iconography)
- **彻底替换：** 移除所有现有的 emoji 图标（📘📚📝🧠📖📥📤🗑🔍 等）。
- **新风格：** 统一使用 **Lucide** 线条图标库（Stroke-width: 1.5-2px），深色（`--ink`）。
- **引入方式：** CDN script 标签 + `<i data-lucide="icon-name">` 标记。

---

## 四、 代码工程规范 (Engineering Guidelines)

### 1. 拒绝代码臃肿 (No Code Bloat)
- 严禁在现有样式上层层叠加补丁。重构 `styles.css` 时，必须**彻底清空并重写**不再需要的旧样式。
- 保持 DOM 结构扁平，严禁为了实现视觉效果而写出多层嵌套的 `div` (Div Soup)。

### 2. 模块化与可重用性 (Componentization)
- 将导航栏、侧边栏、主内容区的样式清晰隔离。
- 相同的复古按钮或卡片，必须提炼出统一的样式类，禁止在每个元素上重复复制一长串完全相同的 CSS 属性。

### 3. 代码输出要求 (Output Rule)
- **禁止偷懒：** 输出代码时**绝对不能使用 `// 其它代码保持不变...` 等省略号**。
- 每次修改必须输出**完整、无损、可直接运行的页面代码**。
- 随时清理因风格切换而产生的死代码（Dead Code）与废弃变量。

---

## 五、 详细执行步骤 (Implementation Steps)

> 按顺序执行。每步完成后在浏览器中打开 `src/index.html` 验证效果，确认无误再进入下一步。

---

### 第 1 步：全局 CSS 设计令牌重写

**文件：** `src/css/styles.css`

**操作：** 将整个 `:root` 块替换为「第二章：新配色体系」中定义的全部 CSS 变量。移除旧的莫兰迪色变量（`--dusty-blue*`、`--dusty-rose*`、`--warm-*` 等）。

**涉及变量对照表（旧 → 新）：**

| 旧变量 | 新变量 | 说明 |
|--------|--------|------|
| `--warm-bg` | `--paper` | 页面主背景 |
| `--warm-card` | `--paper-card` | 卡片背景 |
| `--white` | `--paper-white` | 最亮表面 |
| `--warm-sidebar` | `--paper-dark` | 侧边栏背景 |
| `--warm-100` ~ `--warm-700` | `--ink` / `--ink-light` / `--ink-muted` | 文字色阶（大幅简化） |
| `--warm-200/300` | `--ink` 或 `--paper-border` | 边框色 |
| `--dusty-blue*` | `--slate*` | 次强调色 |
| `--dusty-rose*` | `--rose*` | 主强调色 |
| `--red` | `--danger` | 语义红色 |
| `--red-bg` | `--danger-bg` | 语义红色背景 |
| `--green` | `--success` | 语义绿色 |
| `--green-bg` | `--success-bg` | 语义绿色背景 |
| `--radius` / `--radius-lg` | `--radius` / `--radius-sm` | 圆角（大幅缩小值） |
| `--shadow` / `--shadow-md` / `--shadow-lg` | `--shadow` / `--shadow-sm` | 硬阴影替换模糊阴影 |

**要点：**
- 新增 `--sage*` 系列变量（鼠尾草绿）作为第三强调色
- 新增 `--font-display`、`--font-body`、`--font-mono` 字体变量
- 删除所有不再使用的旧变量

---

### 第 2 步：全局样式 Reset + Body + 基础元素重写

**文件：** `src/css/styles.css`

**操作：**
1. 重写 `body` 样式：
   - `font-family: var(--font-body)`
   - `color: var(--ink)`（从 `--warm-700` 改过来，对比度大幅提升）
   - `background: var(--paper)`
2. 移除 `.hand-drawn-top`、`.hand-drawn-bottom` 手绘虚线分割线类（不再适用）
3. 更新 `a` 标签颜色：`color: var(--rose)`（从 `--dusty-blue` 改过来）

---

### 第 3 步：整体布局 + 侧边栏重写

**文件：** `src/css/styles.css`

**修改组件／类：**

#### 3.1 `#sidebar`
- `background: var(--paper-dark)`
- `border-right: 2px solid var(--ink)`（从 `3px double var(--warm-300)` 改过来，更粗犷的报纸风）

#### 3.2 `.sidebar-header`
- `border-bottom: 2px solid var(--ink)`（实线替代虚线）
- h2 标题：
  - `font-family: var(--font-display)` **← 核心：品牌名使用衬线体，营造报纸头版感**
  - `font-size: 24px`（加大）
  - `font-weight: 900`
  - `color: var(--ink)`
  - `letter-spacing: 1px`
  - `text-transform: uppercase`
- p 副标题：
  - `font-size: 11px`
  - `color: var(--ink-muted)`
  - `font-style: italic`
  - `letter-spacing: 2px`
  - `text-transform: uppercase`

#### 3.3 `.sidebar-course-item`
- `border: 2px solid transparent`
- `border-radius: var(--radius)`（从 `10px 6px 10px 6px` 改直角）
- hover 时：`background: var(--paper-card); border-color: var(--ink);`（黑色实线边框，不再用 transform 位移）
- active 时：`background: var(--rose-bg); border-color: var(--ink); font-weight: 700; box-shadow: var(--shadow-sm);`

#### 3.4 `.sidebar-course-dot`
- `border-radius: var(--radius)`（从 `3px` rotate 45deg 菱形改为小方块）
- `transform: none`（去掉旋转）

#### 3.5 `.sidebar-footer`
- `border-top: 2px solid var(--ink)`（实线替换虚线）

---

### 第 4 步：顶部导航栏重写

**文件：** `src/css/styles.css`

**修改组件／类：**

#### `#topbar`
- `background: var(--paper-white)`
- `border-bottom: 2px solid var(--ink)`（实线替代 double 虚线）

#### `.topbar-tab`
- `border-radius: var(--radius) var(--radius) 0 0`（直角，像文件夹标签）
- `border: 2px solid transparent`
- `border-bottom: none`
- `font-size: 15px`
- `font-weight: 700`
- `color: var(--ink-muted)`
- `letter-spacing: 1px`
- hover 时：`background: var(--paper); color: var(--ink);`
- active 时：
  - `background: var(--paper);`
  - `color: var(--ink);`
  - `border-color: var(--ink);`
  - `box-shadow: none;`（去掉阴影，因为标签与下方内容区相连）

---

### 第 5 步：卡片系统 + 课程网格重写

**文件：** `src/css/styles.css`

**修改组件／类：**

#### `.card`
- `background: var(--paper-card)`
- `border: 2px solid var(--ink)`
- `border-radius: var(--radius)`
- `padding: 24px`（从 20px 加大）
- `box-shadow: var(--shadow)`
- hover 时：`box-shadow: 4px 6px 0 var(--ink)`（阴影向下延伸，制造立体感）

#### `.card-header` / `.card-title`
- `.card-title`：`font-size: 18px; color: var(--ink); font-weight: 800;`

#### `.course-grid`
- 保持 `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`
- `gap: 20px`

#### `.course-card`
- `border-left: 6px solid var(--rose)`（豆沙色左边条）
- `border-radius: var(--radius)`
- hover 时：`border-left-width: 8px; transform: translateY(-2px);`（保留微动效）
- `.course-meta`：`color: var(--ink-muted);`

---

### 第 6 步：按钮系统重写

**文件：** `src/css/styles.css`

**修改组件／类：**

#### `.btn`
- `border-radius: var(--radius)`（从圆润胶囊改为直角微圆角）
- `border: 2px solid var(--ink)`（默认带黑边框）
- `font-weight: 700`
- `padding: 10px 20px`
- `letter-spacing: 0.5px`
- hover 时：`transform: translateY(-1px);`

#### `.btn-primary`
- `background: var(--rose)`
- `color: var(--paper-white)`
- `border-color: var(--ink)` **← 注意：豆沙色背景 + 黑色边框**
- `box-shadow: var(--shadow)`
- hover：`background: var(--rose-hover); box-shadow: 2px 2px 0 var(--ink);`（阴影缩小模拟按下）

#### `.btn-secondary`
- `background: var(--paper-white)`
- `color: var(--ink)`
- `border-color: var(--ink)`
- hover：`background: var(--paper);`

#### `.btn-danger`
- `background: var(--danger-bg)`
- `color: var(--danger)`
- `border-color: var(--ink)` **← 危险按钮也是黑边框**
- hover：`background: #f5d8d6;`

#### `.btn-sm`
- `padding: 6px 14px; font-size: 12px; border-radius: var(--radius);`

#### `.btn-icon`
- `border-radius: var(--radius)`
- `border: 2px solid transparent`
- hover：`border-color: var(--ink); background: var(--paper);`

#### 新增类 `.btn-ghost`
> 为思维导图面板、概念卡片内的文字操作按钮提供统一外观
- `background: transparent; border: none; color: var(--ink-light); padding: 4px 8px; font-size: 12px; cursor: pointer;`
- hover：`color: var(--ink); text-decoration: underline;`

---

### 第 7 步：弹窗/Modal 重写

**文件：** `src/css/styles.css`

**修改组件／类：**

#### `.modal-overlay`
- `background: rgba(0,0,0,0.6)`（加深遮罩，从 `rgba(61,56,53,0.45)` 改过来）

#### `.modal`
- `background: var(--paper-card)`
- `border: 2px solid var(--ink)`
- `border-radius: var(--radius)`
- `box-shadow: 6px 6px 0 var(--ink)`（大硬阴影）
- `padding: 32px`（加大内边距）
- `width: 560px`（加宽）

#### `.modal h3`
- `font-family: var(--font-display)` **← 弹窗标题使用衬线体**
- `font-size: 20px; font-weight: 900; color: var(--ink);`
- `border-bottom: 2px solid var(--ink)`（实线分隔）

#### `.modal-actions`
- `border-top: 2px solid var(--ink)`（实线分隔）

---

### 第 8 步：表单元素重写

**文件：** `src/css/styles.css`

**修改组件／类：**

#### `.form-group label`
- `color: var(--ink)`（从 `--dusty-rose` 改过）
- `font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;`

#### `.form-input` / `.form-textarea`
- `border: 2px solid var(--ink)`（黑实线边框）
- `border-radius: var(--radius)`
- `background: var(--paper-white)`
- `color: var(--ink)`
- `padding: 12px 14px`（加大内边距）
- focus 时：`border-color: var(--ink); box-shadow: 2px 2px 0 var(--ink); outline: none;`（硬阴影聚焦提示，替代原来的柔和光晕）

#### `.form-textarea`
- `min-height: 80px; resize: vertical;`

---

### 第 9 步：颜色选择器 + Tag + 搜索栏 重写

**文件：** `src/css/styles.css`

**修改组件／类：**

#### `.color-options` / `.color-option`
- `.color-option`：`border-radius: var(--radius); border: 2px solid transparent;`
- hover：`transform: scale(1.1);`（去掉旋转）
- `.color-option.selected`：`border-color: var(--ink); box-shadow: 2px 2px 0 var(--ink);`（硬阴影选中提示）

#### `.tag`
- `background: var(--slate-bg)`
- `color: var(--slate)`
- `border: 1.5px solid var(--ink)`（黑边框）
- `border-radius: var(--radius)`
- `font-size: 12px; font-weight: 700;`

#### `.search-bar input`
- `border: 2px solid var(--ink)`
- `border-radius: var(--radius)`
- `background: var(--paper-white)`
- focus 时：`box-shadow: 2px 2px 0 var(--ink);`（去掉蓝色光晕）
- **移除** `.search-bar::before` 中的 emoji `🔍`（改用 Lucide 图标，见第 16 步）

---

### 第 10 步：概念卡片 + 树形结构 + 推导区块 重写

**文件：** `src/css/styles.css`

**修改组件／类：**

#### `.concept-card-header`
- `background: var(--paper-card)`
- `border: 2px solid var(--ink)`
- `border-radius: var(--radius)`
- `padding: 16px 20px`（加大内边距）
- hover：`background: var(--rose-bg); border-color: var(--ink);`
- 展开状态（`.concept-card.open .concept-card-header`）：`border-radius: var(--radius) var(--radius) 0 0; border-color: var(--ink); background: var(--rose-bg)`

#### `.concept-card-body`
- `border: 2px solid var(--ink); border-top: none;`
- `border-radius: 0 0 var(--radius) var(--radius)`
- `padding: 24px`（大幅加大）
- `background: var(--paper-white)`

#### `.concept-level-bar`（树形层级色条）
- `width: 2px; min-width: 2px; border-radius: 0;`
- 颜色：根据层级分别使用 `var(--rose)`（L0）、`var(--slate)`（L1）、`var(--sage)`（L2）

#### `.tree-toggle`（展开/折叠箭头）
- `color: var(--ink); font-size: 12px;`
- hover：`background: var(--paper);`

#### `.derivation-block`
- `background: var(--paper-white)`
- `border: 2px solid var(--ink)`
- `border-left: 4px solid var(--rose)`（豆沙色左边条）
- `border-radius: var(--radius)`
- `padding: 16px; margin-bottom: 12px;`

#### `.derivation-block .derivation-title`
- `font-weight: 800; color: var(--ink);`

#### `.formula-preview`
- `background: var(--paper);`
- `border: 2px solid var(--ink);`
- `border-radius: var(--radius);`
- `min-height: 48px; padding: 14px 16px;`

---

### 第 11 步：图片缩略图 + 空状态 重写

**文件：** `src/css/styles.css`

#### `.image-thumb`
- `border: 2px solid var(--ink)`
- `border-radius: var(--radius)`
- hover：`border-color: var(--rose);`

#### `.empty-state`
- `color: var(--ink-muted)`
- `.empty-icon`：`font-size: 64px;`

---

### 第 12 步：思维导图容器 重写

**文件：** `src/css/styles.css`

#### `#mindmap-container`
- `background: var(--paper)`
- `border: 2px solid var(--ink)`
- `border-radius: var(--radius)`
- `height: calc(100vh - var(--topbar-height) - 56px)`（微调）

---

### 第 13 步：公式参考库布局 重写

**文件：** `src/css/styles.css`

#### `.latex-ref-layout`
- 保持 flex 左右布局

#### `.latex-ref-sidebar`
- `background: var(--paper-dark)`
- `border: 2px solid var(--ink)`
- `border-radius: var(--radius)`

#### `.latex-ref-sidebar-item`
- `color: var(--ink-light); font-size: 14px;`
- `border-left: 2px solid transparent;`
- hover：`background: var(--paper-card); border-left-color: var(--ink);`
- active：`background: var(--rose-bg); color: var(--rose); font-weight: 700; border-left: 4px solid var(--rose);`

#### `.latex-ref-content`
- `background: var(--paper-card)`
- `border: 2px solid var(--ink)`
- `border-radius: var(--radius)`

#### `.latex-ref-table th`
- `color: var(--ink); border-bottom: 2px solid var(--ink);`

#### `.latex-ref-table td`
- `border-bottom: 1px solid var(--paper-border);`

#### `.latex-ref-table tr:hover`
- `background: var(--slate-bg);`

#### `.latex-ref-code`
- `background: var(--paper); border-radius: var(--radius); color: var(--ink);`

---

### 第 14 步：Toast 提示 + 工具类 重写

**文件：** `src/css/styles.css`

#### `.toast`
- `border: 2px solid var(--ink)`
- `border-radius: var(--radius)`
- `box-shadow: var(--shadow)`
- `background: var(--ink); color: var(--paper-white);`

#### 工具类更新
将所有工具类中的 `var(--warm-400)` 替换为 `var(--ink-muted)`：
- `.text-muted { font-size: 12px; color: var(--ink-muted); }`

---

### 第 15 步：响应式断点 重写

**文件：** `src/css/styles.css`

保持 `@media (max-width: 768px)` 结构，但更新内部变量引用：
- `--sidebar-width: 200px;`
- `.course-grid { grid-template-columns: 1fr; }`
- `.topbar-tab { padding: 8px 14px; font-size: 13px; }`

---

### 第 16 步：HTML 结构调整 + 图标系统替换

**文件：** `src/index.html`

**操作：**

#### 16.1 引入 Google Fonts（在 `<head>` 中加入）
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap" rel="stylesheet">
```

#### 16.2 引入 Lucide 图标库（在 `</body>` 前，KaTeX 检测脚本后）
```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<script>
  window.addEventListener('load', function() {
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
  });
</script>
```

#### 16.3 替换所有 emoji 为 Lucide 图标标记

**侧边栏标题：**
- 旧：`<h2>📘 StudyBoard</h2>`
- 新：`<h2><i data-lucide="book-open"></i> StudyBoard</h2>`（或直接用纯文字，图标通过 CSS `::before` 处理）

**顶部导航标签按钮：**

| 旧文本 | 新文本（Lucide 图标） |
|--------|----------------------|
| `📚 课程` | `<i data-lucide="book-marked"></i> 课程` |
| `📝 例题库` | `<i data-lucide="file-text"></i> 例题库` |
| `🧠 思维导图` | `<i data-lucide="git-graph"></i> 思维导图` |
| `📖 公式参考` | `<i data-lucide="library"></i> 公式参考` |

**侧边栏底部按钮：**

| 旧文本 | 新文本（Lucide 图标） |
|--------|----------------------|
| `+ 新建课程` | `<i data-lucide="plus"></i> 新建课程` |
| `📥 导出` | `<i data-lucide="download"></i> 导出` |
| `📤 导入` | `<i data-lucide="upload"></i> 导入` |
| `🗑 清空` | `<i data-lucide="trash-2"></i> 清空` |

#### 16.4 新增 Lucide 图标的基础样式（在 styles.css 中）
```css
[data-lucide] {
  width: 16px;
  height: 16px;
  stroke-width: 2;
  vertical-align: -3px;
  margin-right: 4px;
}
```

---

### 第 17 步：JS 模板字符串中的 emoji 替换

> 逐个文件修改 JS 中动态生成的 HTML 模板，将所有 emoji 替换为 `<i data-lucide="...">` 标记，并在渲染后调用 `lucide.createIcons()`。

**文件：** `src/js/courses.js`

| 函数 | 旧内容 | 替换为 |
|------|--------|--------|
| `renderSidebarCourses()` | 无 emoji（✅ 已无） | 无需改动 |
| `renderCourseView()` | 无 emoji | 检查确认 |
| 课程卡片中的元信息 | 检查是否有 emoji | 如有则替换 |

**文件：** `src/js/chapters.js`

| 函数 | 旧内容 | 替换为 |
|------|--------|--------|
| 面包屑导航 | 可能有 `📂` 或类似 | 替换为 Lucide `folder`/`chevron-right` |
| 章节操作按钮 | 可能有 `✏️` `🗑` `⬆️` `⬇️` | 替换为 `pencil`/`trash-2`/`chevron-up`/`chevron-down` |
| `renderChapterView()` 中的快捷按钮 | 可能有 emoji | 替换为对应 Lucide 图标 |
| 概念卡片操作按钮 | 可能有 `📝` `🗑` `▶` `▼` | 替换为 `pencil`/`trash-2`/`chevron-right`/`chevron-down` |

**文件：** `src/js/concepts.js`

| 函数 | 旧内容 | 替换为 |
|------|--------|--------|
| `showConceptModal()` 弹窗标题 | 可能有 emoji | 替换 |
| 推导区块标题 | 检查 emoji | 如有则替换 |
| `renderConceptsInChapter()` | 操作按钮 emoji | 统一替换 |
| 展开/折叠箭头 | `▶` / `▼` | 替换为 `chevron-right` / `chevron-down` |

**文件：** `src/js/examples.js`

| 函数 | 旧内容 | 替换为 |
|------|--------|--------|
| `renderExampleView()` | 搜索栏 emoji（🔍） | 替换为 `search` |
| `renderExampleCard()` | 标签、操作按钮中的 emoji | 替换 |
| `showExampleDetailModal()` | 弹窗中的 emoji | 替换 |
| `showExampleModal()` | 表单标签/按钮中的 emoji | 替换 |

**文件：** `src/js/app.js`

| 函数 | 旧内容 | 替换为 |
|------|--------|--------|
| `showModal()` | 弹窗中可能无 emoji | 检查确认 |
| `bindEvents()` | 无 emoji | 无需改动 |

**文件：** `src/js/mindmap.js`

| 函数 | 旧内容 | 替换为 |
|------|--------|--------|
| `renderMindmapView()` | 图例、操作提示、按钮中的 emoji | 替换为 Lucide 图标 |
| 右键菜单项 | 可能有 emoji（🎨 等） | 替换 |

**文件：** `src/js/latexRef.js`

| 函数 | 旧内容 | 替换为 |
|------|--------|--------|
| `renderLatexRefView()` | 复制成功提示中的 emoji | 替换为 `clipboard`/`check` |

**关键注意事项：**
- 每次在 JS 中动态插入包含 `<i data-lucide="...">` 的 HTML 后，需要在 DOM 更新后调用 `lucide.createIcons()`（或 `setTimeout(() => lucide.createIcons(), 0)`）来渲染新图标。
- 在 `app.js` 的 `init()` 末尾添加全局 `lucide.createIcons()` 调用。
- 在 `showModal()` 的 `onReady` 回调中添加 `lucide.createIcons()` 调用。

---

### 第 18 步：CSS 死代码清理

**文件：** `src/css/styles.css`

**操作：**
1. 全文搜索旧变量名（`--warm-`, `--dusty-blue`, `--dusty-rose`），确认已全部替换
2. 删除 `.search-bar::before` 中的 emoji 伪元素（若搜索图标改用 Lucide）
3. 删除不再使用的类（`.hand-drawn-top`, `.hand-drawn-bottom` 等）
4. 检查是否有未引用的 CSS 类，清理之

---

### 第 19 步：全局验证

1. 在浏览器中打开 `src/index.html`
2. 逐个验证以下功能：
   - [ ] 侧边栏：品牌名衬线体显示、课程列表点击切换、新建课程按钮
   - [ ] 顶部导航：4 个标签切换正常、active 状态样式正确
   - [ ] 课程视图：卡片网格、hover 效果、点击进入章节
   - [ ] 章节视图：面包屑、章节排序、概念卡片展开/折叠
   - [ ] 概念弹窗：新建/编辑、公式预览、推导区块操作
   - [ ] 例题库：搜索、筛选、卡片展示、弹窗详情
   - [ ] 思维导图：课程选择、节点拖拽、连线、右键菜单、缩放
   - [ ] 公式参考：分类切换、符号复制
   - [ ] 弹窗系统：保存/取消、ESC 关闭、遮罩关闭
   - [ ] 数据操作：导出/导入 JSON、清空数据
   - [ ] Toast 提示
   - [ ] 所有 Lucide 图标正常渲染
3. 检查控制台是否有 CSS 变量未定义警告

---

### 第 20 步：更新开发日志

**文件：** `devlog/2026-05-21.md`（追加内容）

追加以下记录：
```markdown

## UI 重构：美式复古杂志/报纸风

### 配色体系
- 新增三辅色：豆沙色(`--rose*`)、灰蓝(`--slate*`)、鼠尾草绿(`--sage*`)
- 纸张色系：`--paper` / `--paper-card` / `--paper-white` / `--paper-dark`
- 墨色系：`--ink` / `--ink-light` / `--ink-muted`
- 全局对比度大幅提升

### 视觉效果
- 硬阴影替代模糊阴影（`4px 4px 0 #1a1a1a`）
- 圆角缩至 2-4px（原 10-14px）
- 1-2px 纯黑实线边框替代虚线/点线
- 大标题引入 Playfair Display 衬线体
- Lucide 线条图标全量替换 emoji

### 修改文件
- `src/css/styles.css` — 全局重写
- `src/index.html` — 引入字体 + 图标库，替换 emoji
- `src/js/*.js` — 模板字符串中 emoji → Lucide 图标标记
```

---

## 六、 附录：Lucide 图标映射速查表

| 用途 | Lucide 图标名 | 备选 |
|------|--------------|------|
| 品牌/课程 | `book-open` | `graduation-cap` |
| 课程标签 | `book-marked` | `book` |
| 例题库 | `file-text` | `pen-line` |
| 思维导图 | `git-graph` | `brain` |
| 公式参考 | `library` | `bookmark` |
| 新建/添加 | `plus` | `plus-circle` |
| 编辑 | `pencil` | `edit` |
| 删除 | `trash-2` | `x-circle` |
| 导出 | `download` | — |
| 导入 | `upload` | — |
| 清空/重置 | `trash-2` | `rotate-ccw` |
| 搜索 | `search` | — |
| 展开/右箭头 | `chevron-right` | `arrow-right` |
| 折叠/下箭头 | `chevron-down` | `arrow-down` |
| 上移 | `chevron-up` | `arrow-up` |
| 下移 | `chevron-down` | `arrow-down` |
| 复制 | `clipboard` | `copy` |
| 确认/完成 | `check` | `check-circle` |
| 关闭/取消 | `x` | — |
| 颜色/调色板 | `palette` | `paintbrush` |
| 文件夹 | `folder` | — |
| 图片 | `image` | — |
| 文件/PDF | `file` | `file-text` |
| 标签 | `tag` | — |
| 提示/信息 | `info` | `help-circle` |
| 警告 | `alert-triangle` | `alert-circle` |
| 设置 | `settings` | — |
| 链接/连线 | `link` | — |
| 缩放/放大 | `zoom-in` | `maximize` |
| 撤销 | `undo` | `rotate-ccw` |
| 导出 PDF | `file-output` | `printer` |

---

## 七、 执行流程图

```
第1步: CSS变量重写         ──┐
第2步: Reset+Body重写       ─┤ 基础设施（必须先完成）
第3步: 侧边栏重写           ─┤
第4步: 顶栏重写             ─┤
第5步: 卡片系统重写          ─┤
第6步: 按钮系统重写          ─┤
第7步: 弹窗重写             ─┤ 组件层（可微调顺序）
第8步: 表单重写             ─┤
第9步: 颜色选择器/Tag/搜索   ─┤
第10步: 概念卡片+推导区块    ─┤
第11步: 图片+空状态         ─┤
第12步: 思维导图容器        ─┤
第13步: 公式参考库          ─┤
第14步: Toast+工具类       ─┘
第15步: 响应式              ── 适配层
第16步: HTML结构+图标       ── 标记层
第17步: JS模板emoji替换     ── 逻辑层（最耗时）
第18步: 死代码清理          ── 收尾
第19步: 全局验证            ── 测试
第20步: 更新devlog          ── 文档
```
