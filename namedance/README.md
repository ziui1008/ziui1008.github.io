
# Name Dance 7 Plus Preview

> **极致轻量、绝对公平、开箱即用的纯前端课堂/会议点名系统。**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-7.0.0%20Plus-brightgreen.svg)
![Frontend](https://img.shields.io/badge/frontend-Vanilla%20JS-orange.svg)
![Deployment](https://img.shields.io/badge/deployment-Zero%20Config-ff69b4.svg)

---

## 🌟 项目简介

**Name Dance 7** 是一套专为教育工作者、培训师和会议主持人打造的现代化点名系统。它完全运行在浏览器端，**无需后端服务器、无需安装依赖、无需构建打包**。

项目创新性地采用了 **“主程序 + 名单工坊”的双文件解耦架构**，将现场展示的极致流畅与数据管理的复杂逻辑完美分离。配合自研的**公平负担抽取算法**与惊艳的**液态玻璃 (Liquid Glass) UI**，为您带来前所未有的点名体验。

---

## ✨ 核心特性

### 🎯 主程序 (Name Dance 7 Plus)
- **⚖️ 公平负担算法**：引入“公平债务”模型，被抽中者概率自动降低，未抽中者概率缓慢回升，彻底解决传统随机点名导致的不公问题。
- **🎨 液态玻璃主题**：完美复刻 Apple Vision Pro / iOS 18 的 Liquid Glass 质感，支持 4 种主题（默认、糖果、禅意、液态玻璃）与深浅色模式无缝切换。
- **🎆 原生 Canvas 特效**：零依赖实现彩带、烟花、火花等 60fps 粒子特效，配合细腻的“模糊到清晰”开奖动画，仪式感拉满。
- **📊 全景数据中心**：实时概率预测、历史抽取记录、冷区（从未被抽中）分析，让教学干预有据可依。

### 🛠️ 名单工坊 (Roster Studio)
- **📂 原生 XLSX 解析**：**技术亮点！** 摒弃庞大的 SheetJS，利用浏览器原生 `DecompressionStream` 与 `DOMParser` 手写 ZIP 解压与 XML 解析，实现 0 依赖读取 Excel 文件。
- **🧹 智能数据清洗**：自动识别表头、智能推断学号规律（如 `qb-001` 自动推导 `qb-002`）、一键智能查重与修正。
- **🔄 跨标签页实时同步**：基于 `localStorage` 与 `storage` 事件监听，工坊与主程序数据毫秒级同步，互不干扰。

---

## 🚀 快速开始

**真正的零配置，开箱即用：**

1. 下载本仓库的代码（或克隆到本地）。
2. 确保以下两个文件在同一目录下：
   - `Name-Dance-7-Plus-Preview.html` (主程序)
   - `Name-Dance-Roster-Studio.html` (名单工坊)
3. **双击打开** `Name-Dance-Roster-Studio.html`，导入您的名单。
4. **双击打开** `Name-Dance-7-Plus-Preview.html`，点击“开始点名”即可！

*(💡 提示：推荐将主程序全屏展示在投影仪或大屏上，在教师机的浏览器中打开名单工坊进行管理。)*

---

## 🧠 核心算法：公平负担模型

传统的 `Math.random()` 无法保证长期的绝对公平。Name Dance 7 引入了动态权重抑制算法：

$$ W_{eff} = \left( W_{base} \times \frac{1}{1 + Debt \times K} \right)^S $$

| 参数 | 含义 | 说明 |
| :--- | :--- | :--- |
| $W_{eff}$ | **有效权重** | 最终参与随机池计算的权重值。 |
| $W_{base}$ | **基础权重** | 教师可为特定学生（如课代表）手动设置的 1-100 的基础值。 |
| $Debt$ | **公平负担** | 被抽中时 $+1$，未被抽中时 $-0.15$（自然衰减）。 |
| $K$ | **公平强度** | 控制面板中的“公平抑制”滑块，值越大，被抽中后的冷却时间越长。 |
| $S$ | **权重敏感度** | 通过指数函数放大或缩小基础权重的差异。 |

**无放回抽样保证**：在单次抽取多人时，系统采用 `weightedPickWithoutReplacement` 算法，确保同一轮次中绝对不会出现重复人名。

---

## 🏗️ 文件结构与架构

```text
Name-Dance-7/
├── Name-Dance-7-Plus-Preview.html  # 🎲 主程序：现场展示、抽取逻辑、动画特效
├── Name-Dance-Roster-Studio.html   # 🛠️ 名单工坊：CRUD、文件解析、数据清洗
└── README.md                       # 📖 项目说明文档
```

**数据流转机制**：
两个 HTML 文件完全独立，通过浏览器的 `localStorage` (Key: `nd7_secure_store_v7`) 共享状态。
- 工坊负责写入 `rosters` (名单库) 和 `studentMeta` (权重数据)。
- 主程序负责读取名单，并写入 `history` (历史记录) 和更新 `fairnessDebt` (公平负担)。
- 借助 `window.addEventListener("storage")`，任意一方的修改都会实时推送到另一方。

---

## 🛠️ 技术栈

本项目坚持 **“极简主义”**，未使用任何现代前端框架（React/Vue）和构建工具（Webpack/Vite），将原生 Web 技术发挥到极致：

- **核心逻辑**：Vanilla JavaScript (ES6+)
- **样式系统**：Tailwind CSS (CDN) + CSS Custom Properties (变量)
- **图标库**：Lucide Icons
- **现代 Web APIs**：
  - `Canvas 2D` (粒子特效)
  - `Web Audio API` (合成提示音效)
  - `DecompressionStream` (原生 ZIP 解压)
  - `DOMParser` (原生 XML 解析)
  - `BroadcastChannel / Storage Event` (跨标签页通信)

---

## 🌐 浏览器兼容性

得益于对现代 Web API 的使用，本系统需要较新的浏览器支持：

| 浏览器 | 最低版本要求 | 备注 |
| :--- | :--- | :--- |
| **Chrome / Edge** | 80+ | 完美支持所有特性（推荐） |
| **Safari** | 16.4+ | 需支持 `DecompressionStream` |
| **Firefox** | 113+ | 需支持 `DecompressionStream` |

*(注：若在不支持 `DecompressionStream` 的老旧浏览器中打开，系统会自动降级，提示用户使用 CSV 格式导入名单。)*

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！无论是修复 Bug、优化算法，还是增加新的 UI 主题，我们都非常期待。

**开发建议**：
1. 保持纯前端、零依赖的设计哲学。
2. 避免引入庞大的第三方库，优先挖掘浏览器原生 API。
3. 确保代码的向后兼容性，妥善处理 `localStorage` 的数据迁移（参考 `sanitizeStore` 函数）。

---

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。
您可以自由地使用、修改和分发本软件，无论是用于个人教学、学校部署还是商业培训。

---

<p align="center">
  <b>如果这个项目对您的教学或工作有所帮助，请给一个 ⭐️ Star 支持一下！</b>
</p>
```
