# StudyBoard — 学习复习网站

## 项目概述
纯前端网页应用，帮助用户按课程整理知识框架、输入数学公式、添加例题、生成思维导图。
浏览器直接打开 `src/index.html` 即可使用，所有数据保存在 localStorage。

当前进度：基础 8 阶段 + 第一阶段重构（减少代码冗余）已完成。下一步：第二阶段（概念三层层级系统）。

## 目录结构
```
C:\Users\ASUS\Desktop\vs_code\StudyBoard\
├── CLAUDE.md                # 本文件（项目指引）
├── HANDOFF.md               # 新对话交接文档（含完整架构和待办计划）
├── devlog/                  # 开发日志（每日记录）
│   ├── 2026-05-20.md        # 基础 8 阶段全部完成
│   └── 2026-05-21.md        # 第一阶段：减少代码冗余（重构）
├── .github/workflows/       # GitHub Actions 自动部署
├── src/                     # 全部源代码
│   ├── index.html           # 主页面
│   ├── css/
│   │   └── styles.css       # 全局样式（莫兰迪复古杂志风 + 12 个工具类）
│   └── js/
│       ├── app.js           # 入口、路由、AppState、Modal（showModal 支持 onReady 回调）
│       ├── storage.js       # localStorage 读写 + 嵌套数据辅助 + QuotaExceededError 防护
│       ├── courses.js       # 课程 CRUD + 侧边栏渲染
│       ├── chapters.js      # 章节 CRUD + 章节视图渲染
│       ├── concepts.js      # 概念 + 推导区块 + KaTeX 公式预览
│       ├── examples.js      # 例题模块 + tag + 搜索 + 图片/PDF 上传 + filterExamples()
│       ├── latexRef.js      # LaTeX 公式参考库（9 分类 150+ 符号 + 点击复制）
│       ├── mindmap.js       # SVG 思维导图（拖拽节点 + 曲线连线 + 拐点 + 撤销 + 导出 PDF）
│       ├── formulaBar.js    # 公式符号快捷插入工具栏
│       └── utils.js         # 工具函数 + safeRenderKatex / safeRenderKatexToString
```

## 技术栈
- 纯 HTML + CSS + JavaScript（无框架，无构建工具）
- KaTeX CDN 渲染数学公式（通过 `safeRenderKatex` / `safeRenderKatexToString` 统一调用）
- SVG 实现思维导图
- localStorage 数据持久化（`saveCourses`/`saveExamples` 含 QuotaExceededError 防护）
- FileReader + Base64 处理图片

## 关键架构约束
1. **单向数据流**：业务 UI 层禁止直接调用 `localStorage`，所有 CRUD 通过 `storage.js` 辅助函数
2. **嵌套数据操作**：使用 `getChapter()` / `getConcept()` / `saveConcept()` / `deleteConcept()` 操作深层树状结构
3. **弹窗事件**：使用 `showModal(title, bodyHtml, onSave, onReady)` 的 `onReady` 回调绑定 DOM 事件，禁止 `setTimeout` 硬编码延迟
4. **XSS 防线**：所有用户输入渲染为 HTML 前必须经过 `escapeHtml()`
5. **KaTeX 渲染**：统一使用 `safeRenderKatex(latex, target, displayMode)` 和 `safeRenderKatexToString(latex, displayMode)`

## 开发规范
1. 每次只修改一个文件，修改前在终端输出文件名和核心逻辑
2. 遇到任何报错立即停止，向用户汇报
3. 每个阶段完成后更新 devlog/ 日志
4. 所有代码放在 src/ 下
5. 先建框架，逐步添加功能，确保每个阶段可独立验证

## 数据模型（当前版本 v2）

```javascript
// localStorage key: 'sb_courses'
courses: [{
  id, name, color, createdAt,
  chapters: [{
    id, title, order,
    concepts: [{
      id, name, description, formula,
      derivationBlocks: [{ id, title, content }],
      parentId: null,       // 待第二阶段实现：null=顶层，指向父概念 id=子概念
      children: []           // 待第二阶段实现：子概念数组
    }]
  }],
  mindmapConnections: [{ from, to, label, waypoints: [{x, y}] }],
  mindmapNodePositions: { conceptId: {x, y} },
  mindmapNodeColors: { conceptId: "#8a9b9e" }
}]

// localStorage key: 'sb_examples'
examples: [{
  id, title, content, solution,
  tags: [], images: [], pdfs: [{ data, name }],
  courseId
}]
```

## storage.js 关键函数速览

| 函数 | 用途 |
|------|------|
| `getCourses()` / `saveCourses()` | 课程读写（含 QuotaExceededError 防护） |
| `getCourseById(id)` / `addCourse(c)` / `updateCourse(id, u)` / `deleteCourse(id)` | 课程 CRUD |
| `getChapter(cId, chId)` | 按 ID 定位章节 → `{ course, chapter }` |
| `getConcept(cId, chId, coId)` | 按 ID 定位概念 → `{ course, chapter, concept }` |
| `saveConcept(cId, chId, concept)` | 创建/更新概念 + 自动写回 |
| `deleteConcept(cId, chId, coId)` | 删除概念 + 自动写回 |
| `getExamples()` / `addExample()` / `updateExample()` / `deleteExample()` | 例题 CRUD |
| `exportData()` / `importData(file)` / `clearAllData()` | 数据迁移 |
