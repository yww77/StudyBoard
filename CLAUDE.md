# StudyBoard — 学习复习网站

## 项目概述
纯前端网页应用，帮助用户按课程整理知识框架、输入数学公式、添加例题、生成思维导图。
浏览器直接打开 `src/index.html` 即可使用，所有数据保存在 localStorage。

## 目录结构
```
C:\Users\ASUS\Desktop\vs_code\vsCode_test\
├── CLAUDE.md                # 本文件
├── devlog/                  # 开发日志（每日记录）
├── src/                     # 全部源代码
│   ├── index.html           # 主页面
│   ├── css/
│   │   └── styles.css       # 全局样式（蓝色主题）
│   └── js/
│       ├── app.js           # 应用入口、路由、初始化
│       ├── storage.js       # localStorage 读写封装 + 导出/导入
│       ├── courses.js       # 课程 CRUD + UI 渲染
│       ├── chapters.js      # 章节 CRUD + UI 渲染
│       ├── concepts.js      # 概念 + 自定义推导区块 + 公式预览
│       ├── examples.js      # 例题独立模块 + tag + 搜索 + 图片上传
│       ├── latexRef.js      # LaTeX 公式参考库
│       ├── mindmap.js       # SVG 思维导图 + 拖拽连线
│       ├── formulaBar.js    # 公式符号快捷工具栏
│       └── utils.js         # 工具函数（uuid、日期等）
```

## 技术栈
- 纯 HTML + CSS + JavaScript（无框架，无构建工具）
- KaTeX CDN 渲染数学公式
- SVG 实现思维导图
- localStorage 数据持久化
- FileReader + Base64 处理图片

## 开发规范
1. 每次只修改一个文件，修改前在终端输出文件名和核心逻辑
2. 遇到任何报错立即停止，向用户汇报
3. 每个阶段完成后更新 devlog/ 日志
4. 所有代码放在 src/ 下
5. 先建框架，逐步添加功能，确保每个阶段可独立验证

## 数据模型
参见计划文件：C:\Users\ASUS\.claude\plans\generic-percolating-muffin.md
