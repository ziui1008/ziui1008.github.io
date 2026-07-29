# ZIUI Tech

> 独立数字产品、实验性工具，以及带一点玩心的交互系统。

[![License: MIT](https://img.shields.io/badge/License-MIT-ffd93d.svg)](./LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-b3ffd9.svg)](https://pages.github.com/)
[![No runtime dependencies](https://img.shields.io/badge/Runtime%20dependencies-0-b3e0ff.svg)](#技术实现)

ZIUI Tech 是一个持续构建中的个人数字工作室。本仓库汇集工作室主页、创意工具和互动作品，并通过统一的 Launchpad 提供快速入口。

主页采用原生 Web 技术构建，无前端框架和运行时依赖，可直接部署到 GitHub Pages 或任意静态托管服务。

## 在线体验

| 项目 | 类型 | 简介 | 入口 |
| --- | --- | --- | --- |
| **ZIUI Tech Homepage** | 主页 / Launchpad | 工作室主页、作品索引与工具启动台 | [打开主页](https://ziui1008.top/) |
| **Name Dance 7 Plus** | 工具 | 面向课堂与活动场景的名单管理、概率控制、随机抽取和数据统计系统 | [启动 Name Dance](https://ziui1008.top/namedance/Name-Dance.html) |
| **蹭饭大富翁 · 326 班限定版** | 互动游戏 | 沿同学录取地图展开的毕业旅行桌游，包含 17 个同学去向 | [开始旅行](https://ziui1008.top/cf26/index.html) |
| **蹭饭大富翁 · 316 班限定版** | 互动游戏 | 面向 316 班数据制作的毕业旅行版本，包含 60 个同学去向 | [开始旅行](https://ziui1008.top/cf16/index.html) |

GitHub Pages 地址也可以直接访问：

- [Name Dance](https://ziui1008.github.io/namedance/Name-Dance.html)
- [蹭饭大富翁 · 326 班限定版](https://ziui1008.github.io/cf26/index.html)
- [蹭饭大富翁 · 316 班限定版](https://ziui1008.github.io/cf16/index.html)

## 项目组成

### ZIUI Tech Homepage

主页不是传统的静态作品集，而是一个可以直接启动应用的数字工作台。

- 使用 Canvas 绘制 ZIUI Tech 四三角形 Logo
- 带有品牌揭示、加载状态和跳过操作的开屏动画
- Canvas 粒子环境与指针避让效果
- CSS 透视、景深和视差构成的 2.5D 品牌核心
- 液态玻璃风格导航、浮层和项目入口
- 蹭饭大富翁双版本选择菜单
- 项目搜索与快速启动面板
- 明暗主题切换及本地偏好保存
- 桌面、平板和手机响应式布局
- `prefers-reduced-motion` 动效降级和 `backdrop-filter` 回退

### Name Dance 7 Plus

Name Dance 是面向课堂、活动和临时抽取场景设计的名单系统。它不只是随机点名器，还提供名单范围、抽取策略、权重、公平负担和历史统计等能力。

主要功能包括：

- 名单导入与自定义范围
- 单人或多人随机抽取
- 权重与抽取策略控制
- 当前概率预览
- 抽取历史与数据统计
- 多套主题、液态玻璃外观和揭晓特效

### 蹭饭大富翁

蹭饭大富翁是一款围绕毕业去向制作的多人互动桌游。玩家从高中出发，通过掷骰、使用车票、拜访同学和收集城市印章完成一场毕业旅行。

仓库目前包含两个数据版本：

- **326 班限定版**：17 个同学去向
- **316 班限定版**：60 个同学去向

两个版本共享相近的游戏机制和视觉语言，但名单、地图数据及班级文案相互独立。

## 技术实现

项目尽量使用浏览器原生能力，保持静态部署简单、加载链路短且便于长期维护。

| 层级 | 技术 |
| --- | --- |
| 页面结构 | Semantic HTML5 |
| 视觉与布局 | CSS Custom Properties、Grid、Flexbox、Media Queries |
| 动效与交互 | Vanilla JavaScript、Web Animations、Intersection Observer |
| 图形 | Canvas 2D |
| 状态保存 | Local Storage |
| 本地预览 | Node.js 原生 HTTP 模块 |
| 部署 | GitHub Pages / 静态文件托管 |

主页没有 npm 运行时依赖，也不需要构建步骤。

## 主页目录

```text
.
├── index.html      # 页面结构、内容与应用入口
├── styles.css      # 视觉系统、响应式布局和动效
├── app.js          # Canvas Logo、开屏、粒子与交互逻辑
├── serve.mjs       # 无依赖的本地静态服务器
├── README.md       # 项目说明
└── LICENSE         # MIT License
```

其他应用通过各自的站点目录发布，并由主页中的 Launchpad 统一索引。

## 本地运行

### 环境要求

- Node.js 18 或更高版本
- 支持现代 Web API 的浏览器

### 启动主页

```bash
node serve.mjs
```

访问：

```text
http://127.0.0.1:4173/
```

使用其他端口：

```powershell
$env:PORT=8080
node serve.mjs
```

```bash
PORT=8080 node serve.mjs
```

由于入口使用生产环境的绝对地址，从本地主页打开其他应用时会跳转到已部署版本。

## 部署

仓库可以直接作为静态站点部署，无需安装依赖或生成构建产物。

### GitHub Pages

1. 将仓库推送至 GitHub。
2. 打开仓库的 **Settings → Pages**。
3. 在 **Build and deployment** 中选择 **Deploy from a branch**。
4. 选择需要发布的分支和根目录 `/`。
5. 保存并等待 GitHub Pages 完成部署。

如果使用自定义域名，请在 GitHub Pages 设置中配置域名，并根据域名服务商要求添加 DNS 记录。

## 浏览器支持

建议使用较新版本的 Chrome、Edge、Firefox 或 Safari。页面会在不支持背景模糊的浏览器中使用纯色面板，并为启用“减少动态效果”的用户关闭高频动画。

## 贡献

欢迎通过 Issue 或 Pull Request 提交错误修复、体验改进和新工具建议。

提交前请注意：

1. 保持项目可以直接静态部署，不要无必要地引入大型运行时依赖。
2. 新增页面应同时检查桌面端和移动端布局。
3. 动效需要提供 `prefers-reduced-motion` 降级。
4. 不要向公开仓库提交真实姓名、名单、联系方式或其他未经授权的个人数据。
5. 提交代码前确认应用入口、键盘操作和主要交互仍然可用。

## 许可证

本仓库采用 [MIT License](./LICENSE) 开源。

你可以自由使用、复制、修改、合并、发布、分发、再许可和销售本项目的副本，但必须在相关副本中保留原始版权声明和许可证声明。

Copyright © 2026 ZIUI Tech
