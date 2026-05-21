# 课程信息区块 — 实施计划

## 目标

为课程卡片添加完整信息区块，使课程视图不仅显示课程名称，还能展示：
- **学分** (ECTS/Credits)
- **考试信息**：日期、具体时间、地点、允许的 Hilfsmittel
- **倒计时**：距考试剩余天数（实时计算，非存储字段）
- **Bonustest 信息**：支持多条，可动态增减（日期、奖励分数、Hilfsmittel）

## 设计原则

1. **复用现有模式**：沿用 `updateCourse()` 浅合并、`showModal()` + `onReady` 回调、`escapeHtml()` 转义等既有基础设施
2. **数据模型内聚**：所有新字段集中在一个 `courseInfo` 子对象中，不污染 course 顶层
3. **零冗余**：倒计时为计算属性（不存储），Bonustest 为动态数组（无固定上限）
4. **渐进增强**：旧课程自动迁移补全默认值，旧单条 Bonustest 格式自动转换为新数组格式

---

## 数据模型（最终版本）

### course.courseInfo 结构

```javascript
courseInfo: {
  credits: '',              // 学分数（自由文本，兼容 "6" / "7.5" 等格式）
  examDate: '',             // 考试日期 (YYYY-MM-DD)
  examTime: '',             // 具体时间 (如 "14:00-16:00")
  examLocation: '',         // 考试地点
  examHilfsmittel: '',      // 考试允许的辅助工具（自由文本）
  bonustests: [{            // Bonustests 数组（支持多条动态增减）
    date: '',               //   Bonustest 日期 (YYYY-MM-DD)
    points: '',             //   奖励分数（自由文本）
    hilfsmittel: ''         //   允许的辅助工具（自由文本）
  }]
}
```

### 旧格式兼容

旧版单条 Bonustest 格式（`hasBonus + bonusPoints + bonusDate + bonusHilfsmittel`）
在迁移阶段自动转换为 `bonustests` 数组格式，无需用户手动处理。

---

## 实施步骤（均已完成）

### 步骤 1：utils.js — 新增 calcDaysUntil()

**文件**：`src/js/utils.js`

- 纯函数：输入 YYYY-MM-DD，返回距今天数（负数=已过期），无效输入返回 null
- 使用 `T00:00:00` 避免时区偏移，`Math.ceil` 确保整天计数

### 步骤 2：storage.js — 数据迁移 + 默认值补全

**文件**：`src/js/storage.js`

1. `migrateConceptsData()` → 重命名为 `migrateCourseData()`
2. 新增 course 级别迁移：
   - `courseInfo` 缺失 → 补全默认空对象
   - `mindmapNodeColors` 缺失 → 补全空对象
   - 旧单条 Bonustest 格式 → 自动转换为 `bonustests[]`
3. `addCourse()` 安全网：自动补全 `courseInfo` + `mindmapNodeColors` 默认值

### 步骤 3：styles.css — 课程信息区块样式

**文件**：`src/css/styles.css`

新增 CSS 类（纯新增，不改动任何现有规则）：
- `.course-info-block` — 信息区块容器，顶部分割线
- `.course-info-row` — 图标+文字水平行
- `.course-countdown` + `.urgent` / `.warning` / `.normal` — 倒计时三色徽章
- `.course-bonus-badge` — Bonustest 黄色小标签
- `.course-info-empty` — 空信息占位（点击触发编辑）

### 步骤 4：courses.js — 编辑弹窗 + 卡片渲染升级

**文件**：`src/js/courses.js`

新增/修改的函数：
- `renderCourseInfoBar(course)` — 纯函数，返回课程信息栏 HTML（仅显示有值的字段）
- `showEditCourseInfoModal(course)` — 编辑弹窗，含 Bonustest 动态增删
- `renderCourseView()` — 卡片新增 info 按钮 + 信息栏渲染
- `showNewCourseModal()` — 无需改动（`addCourse` 安全网自动补全）

---

## 文件改动清单（最终）

| 顺序 | 文件 | 改动内容 | 状态 |
|:--:|------|---------|:--:|
| 1 | `src/js/utils.js` | 新增 `calcDaysUntil()` 纯函数 | ✅ |
| 2 | `src/js/storage.js` | `migrateCourseData()` 迁移 + `addCourse` 安全网 | ✅ |
| 3 | `src/css/styles.css` | 新增 6 个课程信息 CSS 类 | ✅ |
| 4 | `src/js/courses.js` | 新增弹窗/渲染函数 + 卡片升级 + Bonustest 动态数组 | ✅ |

---

## 测试清单

| # | 测试项 | 结果 |
|---|--------|:--:|
| 1 | 新建课程 → 卡片显示空信息占位 | ✅ |
| 2 | 编辑课程信息 → 填写所有字段 → 卡片正确显示 | ✅ |
| 3 | 仅填部分字段 → 卡片仅显示有值的行 | ✅ |
| 4 | 倒计时计算 → 未来日期/过去日期/边界值 | ✅ |
| 5 | Bonustest 添加/删除多条 → 正确存储和显示 | ✅ |
| 6 | 旧课程兼容 → 自动补全 courseInfo | ✅ |
| 7 | 旧单条 Bonustest → 自动迁移为数组 | ✅ |
| 8 | XSS 安全 → escapeHtml 覆盖所有用户输入 | ✅ |
| 9 | 导出/导入 → courseInfo 随课程数据完整导出导入 | ✅ |
| 10 | 数据持久化 → 关闭浏览器重开，信息保留 | ✅ |

---

## Bug 修复记录

| # | 问题 | 原因 | 修复 |
|---|------|------|------|
| 1 | 课程模块显示「加载中」 | `renderCourseInfoBar` 中 `const bonustests` 两次声明导致 SyntaxError，`courses.js` 解析失败 | 删除第 275 行重复声明 |
